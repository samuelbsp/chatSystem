<?php
/* Ceci est la classe de base, utilisé par ChatLine et ChatUser */

class ChatBase{

    // Ce constructeur est utilisé par toutes les classes:

    public function __construct(array $options){

        foreach($options as $k=>$v){
            if(isset($this->$k)){
                $this->$k = $v;
            }
        }
    }
}
?>