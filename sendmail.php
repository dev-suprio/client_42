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

// Headers — send "From" your own domain so it isn't flagged as spoofed,
// and set Reply-To to the visitor so you can reply straight to them.
$fromAddress = 'no-reply@cozyfeetuk.co.uk';
$headers  = "From: CozyFeet Website <$fromAddress>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Send
$sent = @mail($TO, $subject, $body, $headers, "-f$fromAddress");

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Sent']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail could not be sent']);
}
