<?php
    require 'vendor/autoload.php';
    use \Mailjet\Resources;
    $mj = new \Mailjet\Client(getenv('MJ_APIKEY_PUBLIC'), getenv('MJ_APIKEY_PRIVATE'),true,['version' => 'v3.1']);

    $name = $_POST['name'];
    $user_email = $_POST['email'];
    $message = $_POST['message'];

    $body = [
        'Messages' => [
            [
                'From' => [
                    'Email' => $user_email,
                    'Name' => $name
                ],
                'To' => [
                    [
                        'Email' => "qis.board@umich.edu",
                        'Name' => "QIS Board"
                    ]
                ],
                'Subject' => 'New Form Submission',
                'TextPart' => $message,
            ]
        ]
    ];
    $response = $mj->post(Resources::$Email, ['body' => $body]);
    $response->success() && var_dump($response->getData());
?>