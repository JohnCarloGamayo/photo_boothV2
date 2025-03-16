<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['images']) || count($data['images']) !== 3) {
        echo "Error: 3 images required.";
        exit;
    }

    $imageFiles = [];
    foreach ($data['images'] as $index => $imageData) {
        $imageData = str_replace('data:image/png;base64,', '', $imageData);
        $imageData = base64_decode($imageData);
        $imageFile = "uploads/photo_" . time() . "_$index.png";

        if (!file_put_contents($imageFile, $imageData)) {
            echo "Failed to save image $index.";
            exit;
        }

        $imageFiles[] = $imageFile;
    }

    $mail = new PHPMailer(true);
    try {
        // SMTP Settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'johncarlogamayo@gmail.com';
        $mail->Password = 'oewz nopj xfqk obux'; // Ensure security, do not expose credentials
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Email Recipient
        $mail->setFrom('johncarlogamayo@gmail.com', 'Photo Booth');
        $mail->addAddress('johncarlogamayo@gmail.com'); // Change this to the recipient's email

        // Email Content
        $mail->isHTML(true);
        $mail->Subject = "New Photo Booth Captures";
        $mail->Body = "All 3 photos have been captured and attached.";

        // Attach each image
        foreach ($imageFiles as $file) {
            $mail->addAttachment($file);
        }

        $mail->send();
        echo "Photos sent successfully!";
    } catch (Exception $e) {
        echo "Mailer Error: " . $mail->ErrorInfo;
    }
}
?>
