$(document).ready(function(){

    chat.init();


});

var chat = {

    // data contient les variables utiliser dans la class:

    data : {
        lastID         : 0,
        noActivity    : 0
    },

    // Init associe les écouteur d'évènement et débute les timers

    init : function(){

        // Utilise le texte par défaut du Plugin Jquery:
        $('#name').defaultText('Nickname');
        $('#email').defaultText('Email (Gravatars are Enabled)');

        // Converti le Div #chatLineHolder en jScrollPane, et sauvegarde le plugin dans le chat.data:


        chat.data.jspAPI = $('#chatLineHolder').jScrollPane({
            verticalDragMinHeight: 12,
            verticalDragMaxHeight: 12
        }).data('jsp');

        // Utilise la variable Working pour prévenir les soumissions multiples:

        var working = false;

        // Connecte une personne au chat:

        $('#loginForm').submit(function(){


            if(working) return false;
            working = true;

            // Utilise la function tzPOST défini au bas:

            $.tzPOST('login',$(this).serialize(),function(r){
                working = false;

                if(r.error){
                    chat.displayError(r.error);
                }
                else chat.login(r.name,r.gravatar);
            });

            return false;
        });
                // Envoi une nouvelle entrée au chat:

        $('#submitForm').submit(function(){

            var text = $('#chatText').val();

            if(text.length == 0){
                return false;
            }

            if(working) return false;
            working = true;

            // Assigne un ID temporaire au chat:
            var tempID = 't'+Math.round(Math.random()*1000000),
                params = {
                    id            : tempID,
                    author        : chat.data.name,
                    gravatar    : chat.data.gravatar,
                    text        : text.replace(/</g,'&lt;').replace(/>/g,'&gt;')
                };

            // Utilise la méthode addChatLine pour ajouter le chat a l'écran immédiatement sans attendre le réponse AJAX:

            chat.addChatLine($.extend({},params));

            // Utilise tzPOST pour envoyer le chat avec un requête AJAX:

            $.tzPOST('submitChat',$(this).serialize(),function(r){
                working = false;

                $('#chatText').val('');
                $('div.chat-'+tempID).remove();

                params['id'] = r.insertID;
                chat.addChatLine($.extend({},params));
            });

            return false;
        });

        // Log out l'utilisateur:

        $('a.logoutButton').live('click',function(){

            $('#chatTopBar > span').fadeOut(function(){
                $(this).remove();
                $('#loginPage').css('display','block');
            });

            $('#submitForm').fadeOut(function(){
                $('#loginForm').fadeIn();
            });

            $.tzPOST('logout');

            return false;
        });

        // Regarde si l'utilisateur est déjà connecté

        $.tzGET('checkLogged',function(r){
            if(r.logged){
                chat.login(r.loggedAs.name,r.loggedAs.gravatar);
                $('#loginPage').css('display','none');
            }
        });

        // Exécute les function timeout

        (function getChatsTimeoutFunction(){
            chat.getChats(getChatsTimeoutFunction);
        })();

        (function getUsersTimeoutFunction(){
            chat.getUsers(getUsersTimeoutFunction);
        })();

    },

    // La function cache les information de connexion 

    login : function(name,gravatar){

        chat.data.name = name;
        chat.data.gravatar = gravatar;
        $('#chatTopBar').html(chat.render('loginTopBar',chat.data));

        $('#loginForm').fadeOut(function(){
            $('#loginPage').css('display','none');
            $('#submitForm').fadeIn();
            $('#chatText').focus();
        });

    },

    // Fait un rendu du HTML

    render : function(template,params){

        var arr = [];
        switch(template){
            case 'loginTopBar':
                arr = [
                '<span><img src="',params.gravatar,'" width="23" height="23" />',
                '<span class="name">',params.name,
                '</span><a href="" class="logoutButton rounded">Déconnexion</a></span>'];
            break;

            case 'chatLine':
                arr = [
                    '<div class="chat chat-',params.id,' rounded"><span class="gravatar">'+
                    '<img src="',params.gravatar,'" width="23" height="23" '+
                    'onload="this.style.visibility=\'visible\'" />',
                    '</span><span class="author">',params.author,
                    ':</span><span class="text">',params.text,
                    '</span><span class="time">',params.time,'</span></div>'];
            break;

            case 'user':
                arr = [
                    '<div class="user" title="',params.name,'"><img src="',params.gravatar,
                    '" width="30" height="30" onload="this.style.visibility=\'visible\'"'+
                    ' /></div>'
                ];
            break;
        }

        // fait un join du array

        return arr.join('');

    },
    // La function addChatLine ajoute un entrée chat à la page

    addChatLine : function(params){

        // Tout les temps sont affichés dans le user timezone

        var d = new Date();
        if(params.time) {

            // PHP retourne le temps et remplira l'objet date plus tard. Javascript le converti pour nous

            d.setUTCHours(params.time.hours,params.time.minutes);
        }

        params.time = (d.getHours() < 10 ? '0' : '' ) + d.getHours()+':'+
                      (d.getMinutes() < 10 ? '0':'') + d.getMinutes();

        var markup = chat.render('chatLine',params),
            exists = $('#chatLineHolder .chat-'+params.id);

        if(exists.length){
            exists.remove();
        }

        if(!chat.data.lastID){
            //Si c'est le premier message, retire le message disant qu'il n'y en as pas.

            $('#chatLineHolder p').remove();
        }

        // Si ce n'est pas un chat temporaire.
        if(params.id.toString().charAt(0) != 't'){
            var previous = $('#chatLineHolder .chat-'+(+params.id - 1));
            if(previous.length){
                previous.after(markup);
            }
            else chat.data.jspAPI.getContentPane().append(markup);
        }
        else chat.data.jspAPI.getContentPane().append(markup);

        // Reinitialise jScrollPane quand on ajoute du contenu.

        chat.data.jspAPI.reinitialise();
        chat.data.jspAPI.scrollToBottom(true);

    },
    // Cette méthode demande les derniers chat et les ajoute à la page.

    getChats : function(callback){
        $.tzGET('getChats',{lastID: chat.data.lastID},function(r){

            for(var i=0;i<r.chats.length;i++){
                chat.addChatLine(r.chats[i]);
            }

            if(r.chats.length){
                chat.data.noActivity = 0;
                chat.data.lastID = r.chats[i-1].id;
            }
            else{
                // Si il n'y a pas de chat reçu incrémente la variable noActivity

                chat.data.noActivity++;
            }

            if(!chat.data.lastID){
                chat.data.jspAPI.getContentPane().html('<p class="noChats">Pas de message ici.</p>');
            }

            // Set un timeOut pour la prochaine requête basé sur l'activité du chat.

            var nextRequest = 1000;

            // 2 secondes
            if(chat.data.noActivity > 3){
                nextRequest = 2000;
            }

            if(chat.data.noActivity > 10){
                nextRequest = 5000;
            }

            // 15 secondes
            if(chat.data.noActivity > 20){
                nextRequest = 15000;
            }

            setTimeout(callback,nextRequest);
        });
    },

    // Fait une requête de la liste de tout les utilisateurs.

    getUsers : function(callback){
        $.tzGET('getUsers',function(r){

            var users = [];

            for(var i=0; i< r.users.length;i++){
                if(r.users[i]){
                    users.push(chat.render('user',r.users[i]));
                }
            }

            var message = '';

            if(r.total<1){
                message = 'No one is online';
            }
            else {
                message = r.total+' '+(r.total == 1 ? 'person':'people')+' online';
            }

            users.push('<p class="count">'+message+'</p>');

            $('#chatUsers').html(users.join(''));

            setTimeout(callback,15000);
        });
    },

        // Cette méthode affiche un message d'erreur dans le haut de la page:

    displayError : function(msg){
        var elem = $('<div>',{
            id        : 'chatErrorMessage',
            html    : msg
        });

        elem.click(function(){
            $(this).fadeOut(function(){
                $(this).remove();
            });
        });

        setTimeout(function(){
            elem.click();
        },5000);

        elem.hide().appendTo('body').slideDown();
    }
};

// Méthode POST et GET

$.tzPOST = function(action,data,callback){
    $.post('php/ajax.php?action='+action,data,callback,'json');
}

$.tzGET = function(action,data,callback){
    $.get('php/ajax.php?action='+action,data,callback,'json');
}

// Méthode jQuery pour des textes placeHolder:

$.fn.defaultText = function(value){

    var element = this.eq(0);
    element.data('defaultText',value);

    element.focus(function(){
        if(element.val() == value){
            element.val('').removeClass('defaultText');
        }
    }).blur(function(){
        if(element.val() == '' || element.val() == value){
            element.addClass('defaultText').val(value);
        }
    });

    return element.blur();
}