<?php
/* ============================================================
 *  CozyFeet — quote form mail handler
 *  Receives the quote form (JSON via fetch) and emails it to
 *  the address in $TO. Self-hosted — no third-party service.
 * ============================================================ */

// Where enquiries are delivered.
$TO = 'contact@cozyfeetuk.co.uk';

header('Content-Type: application/json; charset=utf-8');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Accept either JSON body or normal form-encoded POST
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// Grab + clean the fields
function clean($v) { return trim(filter_var($v ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS)); }

$name     = clean($data['name']     ?? '');
$email    = clean($data['email']    ?? '');
$phone    = clean($data['phone']    ?? '');
$location = clean($data['location'] ?? '');
$message  = clean($data['message']  ?? '');

// Basic validation (mirrors the front-end)
if ($name === '' || $phone === '' || $location === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields correctly.']);
    exit;
}

// Build the email
$subject = 'New Free Quote Request — CozyFeet Website';

$body  = "You have received a new quote request from the CozyFeet website:\n\n";
$body .= "Name:     $name\n";
$body .= "Email:    $email\n";
$body .= "Phone:    $phone\n";
$body .= "Location: $location\n";
$body .= "Message:\n$message\n\n";
$body .= "----------------------------------------\n";
$body .= "Sent automatically from cozyfeetuk.co.uk\n";

// Headers — "From" MUST be a real mailbox that exists on this server,
// otherwise cPanel's Exim sender-verification silently drops the mail
// even though mail() returns true. We use the same mailbox we deliver to.
// Reply-To is set to the visitor so you can reply straight back to them.
$fromAddress = 'contact@cozyfeetuk.co.uk';
$headers  = "From: CozyFeet Website <$fromAddress>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Send (envelope sender = real mailbox to pass SPF/sender checks)
$sent = @mail($TO, $subject, $body, $headers, "-f$fromAddress");

// Log every attempt so delivery problems can be diagnosed from the server.
@file_put_contents(
    __DIR__ . '/mail_log.txt',
    date('Y-m-d H:i:s') . " | sent=" . ($sent ? 'TRUE' : 'FALSE') .
        " | to=$TO | from=$email ($name)\n",
    FILE_APPEND
);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Sent']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail could not be sent']);
}
