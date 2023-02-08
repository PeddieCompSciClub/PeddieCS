function submitForm() {
    console.log("submitForm()");

    v$.ajax({
        url: 'https://peddiecs.peddie.org/test:5630',
        success: function (data) {
            console.log(data);
        }
    });
}