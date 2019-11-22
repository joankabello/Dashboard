var rates;
var currencies;

$(document).ready(function() {
    buildCombos();
    setFocusToAmount();

    $("#convertForm").submit(function(event){
        event.preventDefault();
        if(!isValidNumber($("#inputAmount").val())){
            return;
        }

        app_id="c3d8f8a350fb424e9571714ffdfab367";
        uri=encodeURI("http://openexchangerates.org/latest.json?app_id="+app_id);

        $.get(uri,function(json) {
            var amount = parseFloat($("#inputAmount").val()).toFixed(2);
            var from = $("#inputFromCurrency").val();
            var to = $("#inputToCurrency").val();
            var conversion = (amount/json.rates[from]) * json.rates[to];
            conversion = parseFloat(conversion).toFixed(2);

            var result = amount + " " + from + " = " + conversion + " " + to;
            $("#conversion").text(result);
        },"jsonp");

        setFocusToAmount();
    });

});


function buildCombos()
{
    $.getJSON ("http://openexchangerates.org/api/currencies.json",
        function(jsondata) {
            var html = '<option value="">Select a currency</option>';
            for(var prop in jsondata) {
                var name = prop + ": " + jsondata[prop];
                html += '<option value="' + prop +'">' + name + '</option>';
            }
            $("#inputFromCurrency").html(html);
            $("#inputToCurrency").html(html);
        }
    );
}

function isValidNumber(input) {
    if(input === undefined || input === null || input.trim().length === 0 ||
        isNaN(input) || input <= 0) {
        showErrorDialog("Please enter a valid positive number for 'Amount'", "Invalid Amount");
        return false;
    }
    return true;
}

function setFocusToAmount() {
    $("#inputAmount").focus();
}

var url = 'http://sagarnpatel.github.io/Exchange-Rates/';
var xhr = createCORSRequest('GET', url);
xhr.send();
