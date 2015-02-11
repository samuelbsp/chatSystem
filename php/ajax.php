<?php

/* Configuration de la base de donnée */

$dbOptions = array(
    'db_host' => 'localhost',
    'db_user' => 'e1124889_chat',
    'db_pass' => 'samouel1994',
    'db_name' => 'e1124889_chatSystem'
);


error_reporting(E_ALL ^ E_NOTICE);
require "classes/DB.class.php";
require "classes/Chat.class.php";
require "classes/ChatBase.class.php";
require "classes/ChatLine.class.php";
require "classes/ChatUser.class.php";

session_name('webchat');
session_start();

if(get_magic_quotes_gpc()){

    array_walk_recursive($_GET,create_function('&$v,$k','$v = stripslashes($v);'));
    array_walk_recursive($_POST,create_function('&$v,$k','$v = stripslashes($v);'));
}

try{

    // Connection à la base de donnée
    DB::init($dbOptions);

    $response = array();

    switch($_GET['action']){

        case 'login':
            $response = Chat::login($_POST['name'],$_POST['email']);
        break;

        case 'checkLogged':
            $response = Chat::checkLogged();
        break;

        case 'logout':
            $response = Chat::logout();
        break;

        case 'submitChat':
            $response = Chat::submitChat($_POST['chatText']);
        break;

        case 'getUsers':
            $response = Chat::getUsers();
        break;

        case 'getChats':
            $response = Chat::getChats($_GET['lastID']);
        break;

        default:
            throw new Exception('Wrong action');
    }

    echo json_encode($response);
}
catch(Exception $e){
    die(json_encode(array('error' => $e->getMessage())));
}
?>