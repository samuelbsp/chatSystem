<?php
/* Chat line est utilisé pour les entré de chat */

class ChatLine extends ChatBase{

    protected $text = '', $author = '', $gravatar = '';

    public function save(){
        DB::query("
            INSERT INTO webchat_lines (author, gravatar, text)
            VALUES (
                '".DB::esc($this->author)."',
                '".DB::esc($this->gravatar)."',
                '<p>".DB::esc($this->text)."</p>'
        )");

        // Retourne l'objet MySQLi the la class DB

        return DB::getMySQLiObject();
    }
}
?>