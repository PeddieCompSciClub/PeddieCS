function submitForm() {
    console.log("submitForm()");

    $.ajax({
        url: 'https://peddiecs.peddie.org/nod:5630',
        success: function (data) {
            console.log(data);
        }
    });
}

function submitLoginFunc(){
            
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