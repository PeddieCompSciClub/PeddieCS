function submitForm() {
    console.log("Submit form");
    
    const logResponse = (response) => {
        console.log(response);
    };

    fetch('http://peddiecs.peddie.org:5630/')
        .then(response => response.text())
        .then(logResponse)
        .catch(error => console.error(error));
}