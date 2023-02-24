function submitForm(){
            
    if(window.jQuery){

        $.post("https://peddiecs.peddie.org/nodejs/addMember",{
            email:$('#email').val(),
            verificationCode:$('#code').val()
        },function(res){
            
            if(res.message=="success"){
                console.log("success");
            }else{
                if(res.message){
                    console.log(res.message);
                }
            }
        
        });
        
    }
}