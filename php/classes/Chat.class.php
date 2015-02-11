<?php
/* Méthode statique utilisé par ajax.php */

class Chat{

    public static function login($name,$email){
        if(!$name || !$email){
            throw new Exception('Veuillez remplir tout les champs');
        }

        if(!filter_input(INPUT_POST,'email',FILTER_VALIDATE_EMAIL)){
            throw new Exception('Votre courriel est invalide');
        }

        //
        // Prépare les Gravatar
        $gravatar = md5(strtolower(trim($email)));

        $user = new ChatUser(array(
            'name'        => $name,
            'gravatar'    => $gravatar
        ));

        // Retourne un objet MySQLi
        if($user->save()->affected_rows != 1){
            throw new Exception('Le nickname est utilisé');
        }

        $_SESSION['user']    = array(
            'name'        => $name,
            'gravatar'    => $gravatar
        );

        return array(
            'status'    => 1,
            'name'        => $name,
            'gravatar'    => Chat::gravatarFromHash($gravatar)
        );
    }

    public static function checkLogged(){
        $response = array('logged' => false);

        if($_SESSION['user']['name']){
            $response['logged'] = true;
            $response['loggedAs'] = array(
                'name'        => $_SESSION['user']['name'],
                'gravatar'    => Chat::gravatarFromHash($_SESSION['user']['gravatar'])
            );
        }

        return $response;
    }

    public static function logout(){
        DB::query("DELETE FROM webchat_users WHERE name = '".DB::esc($_SESSION['user']['name'])."'");

        $_SESSION = array();
        unset($_SESSION);

        return array('status' => 1);
    }
    public static function submitChat($chatText){
        if(!$_SESSION['user']){
            throw new Exception('Vous êtes déconnecté');
        }

        if(!$chatText){
            throw new Exception('Aucun message entré');
        }

        $chat = new ChatLine(array(
            'author'    => $_SESSION['user']['name'],
            'gravatar'    => $_SESSION['user']['gravatar'],
            'text'        => $chatText
        ));

        // Retourne un objet MySQLi
        $insertID = $chat->save()->insert_id;

        return array(
            'status'    => 1,
            'insertID'    => $insertID
        );
    }

    public static function getUsers(){
        if($_SESSION['user']['name']){
            $user = new ChatUser(array('name' => $_SESSION['user']['name']));
            $user->update();
        }

        // Supprime les chats et les users après le temps indiqué

        DB::query("DELETE FROM webchat_lines WHERE ts < SUBTIME(NOW(),'72:0:0')");
        DB::query("DELETE FROM webchat_users WHERE last_activity < SUBTIME(NOW(),'0:30:0')");

        $result = DB::query('SELECT * FROM webchat_users ORDER BY name ASC LIMIT 18');

        $users = array();
        while($user = $result->fetch_object()){
            $user->gravatar = Chat::gravatarFromHash($user->gravatar,30);
            $users[] = $user;
        }

        return array(
            'users' => $users,
            'total' => DB::query('SELECT COUNT(*) as cnt FROM webchat_users')->fetch_object()->cnt
        );
    }

    public static function getChats($lastID){
        $lastID = (int)$lastID;

        $result = DB::query('SELECT * FROM webchat_lines WHERE id > '.$lastID.' ORDER BY id ASC');

        $chats = array();
        while($chat = $result->fetch_object()){

            // Retourne le temps de la création du message

            $chat->time = array(
                'hours'        => gmdate('H',strtotime($chat->ts)),
                'minutes'    => gmdate('i',strtotime($chat->ts))
            );

            $chat->gravatar = Chat::gravatarFromHash($chat->gravatar);

            $chats[] = $chat;
        }

        return array('chats' => $chats);
    }

    public static function gravatarFromHash($hash, $size=23){
        return 'http://www.gravatar.com/avatar/'.$hash.'?size='.$size.'&default='.
                urlencode('http://www.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?size='.$size);
    }
}
?>