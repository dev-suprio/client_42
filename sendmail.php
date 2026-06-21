<?php
/* ============================================================
 *  CozyFeet — quote form mail handler (SMTP)
 *  Sends the quote form straight through the contact@ mailbox
 *  via authenticated SMTP. Self-contained — no library needed.
 * ============================================================ */

/* ---------- SETTINGS — fill these in ------------------------ */
$SMTP_HOST = 'cozyfeetuk.co.uk';          // Outgoing server
$SMTP_PORT = 465;                         // 465 = SSL
$SMTP_USER = 'contact@cozyfeetuk.co.uk';  // mailbox login
$SMTP_PASS = '9]bx[]C8Db#[WJ?9'; // <-- the contact@ mailbox password
$TO        = 'contact@cozyfeetuk.co.uk';  // where enquiries are delivered
/* ------------------------------------------------------------ */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Accept JSON body or form-encoded POST
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

function clean($v) { return trim(filter_var($v ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS)); }

$name     = clean($data['name']     ?? '');
$email    = clean($data['email']    ?? '');
$phone    = clean($data['phone']    ?? '');
$location = clean($data['location'] ?? '');
$message  = clean($data['message']  ?? '');

if ($name === '' || $phone === '' || $location === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields correctly.']);
    exit;
}

/* ---------- Build the message ------------------------------- */
$subject = 'New Free Quote Request - CozyFeet Website';

$body  = "You have received a new quote request from the CozyFeet website:\r\n\r\n";
$body .= "Name:     $name\r\n";
$body .= "Email:    $email\r\n";
$body .= "Phone:    $phone\r\n";
$body .= "Location: $location\r\n";
$body .= "Message:\r\n$message\r\n\r\n";
$body .= "----------------------------------------\r\n";
$body .= "Sent automatically from cozyfeetuk.co.uk\r\n";

$fromName = 'CozyFeet Website';
$headers  = "From: $fromName <$SMTP_USER>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Date: " . date('r') . "\r\n";
$headers .= "Subject: $subject\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

/* ---------- Minimal SMTP client ----------------------------- */
function smtp_send($host, $port, $user, $pass, $from, $to, $headers, $body, &$err) {
    $transport = ($port == 465) ? "ssl://$host" : $host;
    $fp = @fsockopen($transport, $port, $errno, $errstr, 20);
    if (!$fp) { $err = "Connect failed: $errstr ($errno)"; return false; }
    stream_set_timeout($fp, 20);

    $read = function () use ($fp) {
        $data = '';
        while ($line = fgets($fp, 515)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $cmd = function ($c) use ($fp, $read) { fputs($fp, $c . "\r\n"); return $read(); };

    $expect = function ($resp, $code) use (&$err, $fp) {
        if (strpos($resp, $code) !== 0) { $err = trim($resp); fclose($fp); return false; }
        return true;
    };

    if (!$expect($read(), '220')) return false;
    if (!$expect($cmd('EHLO cozyfeetuk.co.uk'), '250')) return false;
    if (!$expect($cmd('AUTH LOGIN'), '334')) return false;
    if (!$expect($cmd(base64_encode($user)), '334')) return false;
    if (!$expect($cmd(base64_encode($pass)), '235')) return false;
    if (!$expect($cmd("MAIL FROM:<$user>"), '250')) return false;
    if (!$expect($cmd("RCPT TO:<$to>"), '250')) return false;
    if (!$expect($cmd('DATA'), '354')) return false;

    // dot-stuffing for any line that starts with "."
    $payload = "To: $to\r\n" . $headers . "\r\n" . $body;
    $payload = preg_replace('/^\./m', '..', $payload);
    fputs($fp, $payload . "\r\n.\r\n");
    if (!$expect($read(), '250')) return false;

    $cmd('QUIT');
    fclose($fp);
    return true;
}

$err = '';
$ok  = smtp_send($SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS, $SMTP_USER, $TO, $headers, $body, $err);

@file_put_contents(
    __DIR__ . '/mail_log.txt',
    date('Y-m-d H:i:s') . ' | ' . ($ok ? 'SENT' : 'FAIL: ' . $err) . " | from=$email ($name)\r\n",
    FILE_APPEND
);

if ($ok) {
    echo json_encode(['success' => true, 'message' => 'Sent']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail could not be sent']);
}
