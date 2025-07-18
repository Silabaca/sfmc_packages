%%[
set @clientId = "4UzSx+rP2y4qWT2ZVr54wyPNkECqAugx8GJDq6u03m8="
set @clientSecret = "ducp2bbK5RSf7zlOC95CUwuNI4easvS9wBct9EvxfSI="

set @decryptClientId = DecryptSymmetric(@clientId, "AES", "WaitUntilSymKey", @null, "WaitUntilSaltKey", @null, "WaitUntilSymKey", @null)
set @decryptClientSecret = DecryptSymmetric(@clientSecret, "AES", "WaitUntilSymKey", @null, "WaitUntilSaltKey", @null, "WaitUntilSymKey", @null)

set @subscriberKey = AttributeValue("_subscriberkey")
/*Output(Concat("SK: ", @subscriberKey, "<br>"))*/

]%%

<script runat="server">
Platform.Load("Core", "1");

// Global Variables
var subscriberKey = Platform.Variable.GetValue("@subscriberKey");
var clientId = Platform.Variable.GetValue("@decryptClientId");
var clientSecret = Platform.Variable.GetValue("@decryptClientSecret");
var tokenStorage = "INTL_TOKEN_STORAGE";
var requestSource = "welcomeForm";
var rest_instance_url = "https://mc0xdmr989lqft6f0dhqg5lv4vv4.rest.marketingcloudapis.com/";
var accessToken = null;

try {
    // Check if subscriberKey is valid
    if (!subscriberKey) {
        throw new Error("subscriberKey is null or empty.");
    }

    // Retrieve access token
    accessToken = retrieveAccessToken(clientId, clientSecret, tokenStorage, requestSource);
    //Write("access token: " + accessToken + "<br><br>");

    if (accessToken) {
        try {

            // Attempt to execute the event
            var journeyEvent = executeEvent(subscriberKey, accessToken, rest_instance_url);
            //Write("Response 1: " + journeyEvent.Response + "<br>");
            
        } catch (innerError) {

            // If an error occurs (e.g., token expired), delete the old token
            Platform.Function.DeleteData(tokenStorage, ["SOURCE"], [requestSource]);
            // Retrieve a new access token using getAccessToken
            var newAccessTokenResponse = getAccessToken(clientId, clientSecret);
            // Extract the actual access token from the response
            var newAccessToken = newAccessTokenResponse.accessToken; 
            
            // Insert the new token into the Data Extension
            if (newAccessToken) {
                var insertStatus = Platform.Function.InsertData(tokenStorage, ["ACCESS_TOKEN","SOURCE"],[newAccessToken,requestSource]);
                //Write("New Token: " + Stringify(newAccessToken) + "<br><br>");

                // Retry executing the event with the new token
                try {
                    journeyEvent = executeEvent(subscriberKey, newAccessToken, rest_instance_url);
                    //Write("Event executed with Status Code 2: " + journeyEvent.StatusCode + "<br>");
                    //Write("Response 2: " + journeyEvent.Response + "<br>");
                } catch (retryError) {
                    // Handle the error in re-executing the event
                    var retryErrorMessage = "Error re-executing the event: " + Stringify(retryError);
                    //Write(retryErrorMessage);
                    //logErrorToDataExtension(retryErrorMessage, subscriberKey);
                }
            } else {
                //Write("Could not obtain a new access token.");
                logErrorToDataExtension("Could not obtain a new access token.", subscriberKey);
            }
        }
    } else {
      logErrorToDataExtension("Error retrieving first access token.", subscriberKey);
    }

} catch (error) {
    // Handle any other errors in the main flow
    var errorMessage = "Error: " + Stringify(error);
    //Write(errorMessage);
    logErrorToDataExtension(errorMessage, subscriberKey);
}

// FUNCTIONS

// Retrieve access token
function retrieveAccessToken(clientId, clientSecret, tokenStorage, requestSource) {
    var tokenDE = DataExtension.Init(tokenStorage);
    var tokenRow = tokenDE.Rows.Lookup(["SOURCE"], [requestSource]);
    
    if (tokenRow && tokenRow.length > 0) {
        // Return the stored token
        return tokenRow[0].ACCESS_TOKEN;
    } else {
        // Request a new token if one is not stored
        /*var token = getAccessToken(clientId, clientSecret);
        if (token) {
            // Store the new token
            Platform.Function.InsertData(tokenStorage, ["ACCESS_TOKEN", "SOURCE"], [token.accessToken, requestSource]);
            return token.accessToken;
        }*/
        return null; // Return null if token could not be obtained
    }
}

// Get a new access token
function getAccessToken(clientId, clientSecret) {
    var authEndpoint = 'https://mc0xdmr989lqft6f0dhqg5lv4vv4.auth.marketingcloudapis.com/';
    var payload = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
    };

    var url = authEndpoint + 'v2/token';
    var contentType = 'application/json';

    var accessTokenRequest = HTTP.Post(url, contentType, Stringify(payload));

    if (accessTokenRequest.StatusCode == 200) {
        var tokenResponse = Platform.Function.ParseJSON(accessTokenRequest.Response[0]);
        //Log when the token is updated.
        var logStatus = Platform.Function.InsertData("INTL_TOKEN_REQUEST_LOG", ["SUBKEY", "ORIGIN","TIMESTAMP"], [Platform.Variable.GetValue("@subscriberKey"), "WELCOME_FORM",Platform.Function.Now()]);
        return {
            accessToken: tokenResponse.access_token
        };
    } else {
        var errorMessage = "Error al obtener el Token. Status Code: " + accessTokenRequest.StatusCode + "<br>" + accessTokenRequest.Response;
        logErrorToDataExtension(errorMessage, Platform.Variable.GetValue("@subscriberKey"));
        return null;
    }
}

// Run the event
function executeEvent(subscriberKey, accessToken, rest_instance_url) {
    var eventConfig = {
        requestUrl: rest_instance_url + "interaction/v1/events",
        jsonBody: {
            ContactKey: subscriberKey,
            EventDefinitionKey: "APIEvent-3f23a16a-152e-e1f7-0317-e0a33f7db0f5",
            Data: {
                ContactKey: subscriberKey,
                EventType: "Welcome Form"
            }
        }
    };

    var contentType = 'application/json';
    var headerNames = ["Authorization"];
    var headerValues = ["Bearer " + accessToken];
    var fireEvent = HTTP.Post(eventConfig.requestUrl, contentType, Stringify(eventConfig.jsonBody), headerNames, headerValues);

    return fireEvent; // Returns the event response object
}

// Log errors in the Data Extension
function logErrorToDataExtension(errorMessage, subscriberKey) {
    var dataExtensionKey = "FormEvents_ErrorLog"; 

    var status = Platform.Function.InsertData(dataExtensionKey, 
        ["SubscriberKey", "ErrorMessage"], 
        [subscriberKey, errorMessage]
    );

    return status;
}

</script>