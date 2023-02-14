function submitForm(){
            
    if(window.jQuery){

        $.get("https://peddiecs.peddie.org/nodejs/getAllMembers",{
            email:$('#email').val(),
            password:$('#password').val()
        },function(res){
            
            if(res.message=="success"){
                console.log("success");
            }else{
                if(res.message){
                    console.log(res.message);
                }
                console.log('got the message');
            }
        
        });
        
    }
}