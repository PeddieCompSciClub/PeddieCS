function submitForm(){
            
    if(window.jQuery){

        $.gets("https://peddiecs.peddie.org/nodejs/test",{
            email:$('#email').val(),
            password:$('#password').val()
        },function(res){
            
            if(res.message=="success"){
                console.log("success");
            }else{
                if(res.message){
                    alert(res.message);
                }
                console.log('got the message');
            }
        
        });
        
    }
}