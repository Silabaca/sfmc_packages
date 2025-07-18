%%[
VAR @currentLocalTime
SET @currentLocalTime = SystemDateToLocalDate(NOW())
]%%
<script runat="server">
  Platform.Load("core", "1.1.1");
  var request = Platform.Function.LookupRows("PEC_CREDENTIALS_STORE", "Process", "PEC_PREPROD");
  var result = request[0];
  var clientIdJourney = decryptSymmetric(result.client_id);
  var clientSecJourney = decryptSymmetric(result.client_secret);
  var setup = {
    authBaseURI: "https://mc0xdmr989lqft6f0dhqg5lv4vv4.auth.marketingcloudapis.com/",
    restBaseURI: "https://mc0xdmr989lqft6f0dhqg5lv4vv4.rest.marketingcloudapis.com/",
    clientId: clientIdJourney,
    clientSecret: clientSecJourney,
    eventDefinitionKey: "Preprod_Promo_Email_Capture_API_Journey"
  }
//  clientId: "ufy9oxt50w7veaqoz1p4aimy",
//  clientSecret: "0jvpvInx54tJDFUOD1HH1qBe",
  try {
    var referer = Platform.Request.ReferrerURL;
    var regex = /new.royalcaribbean\.com/g;
    var match = referer.match(regex);
    var origin = (match.length > 0) ? match[0] : null;
    if (origin != null || 1==1) {
      Platform.Response.SetResponseHeader("Strict-Transport-Security","max-age=200");
      Platform.Response.SetResponseHeader("X-XSS-Protection","1; mode=block");
      Platform.Response.SetResponseHeader("X-Frame-Options","Deny");
      Platform.Response.SetResponseHeader("X-Content-Type-Options","nosniff");
      Platform.Response.SetResponseHeader("Referrer-Policy","strict-origin-when-cross-origin");
      Platform.Response.SetResponseHeader("Content-Security-Policy","default-src 'self'");
      var prox = new Script.Util.WSProxy();
      var jsonpost = Platform.Request.GetPostData();
      var json = Platform.Function.ParseJSON(jsonpost);
      // Remove this after PEC A/B Testing Finish
      var DELog = Platform.Function.InsertData("PEC_DATA",["DATA"],[Stringify(json)]);
      var ip = Platform.Request.ClientIP();
      var url = 'http://ip-api.com/json/'
      var response = HTTP.Get(url + ip);
      var ipJson = Platform.Function.ParseJSON(response.Content);
      var DELog = Platform.Function.InsertData("PEC_DATA_PREPROD",["DATA", "REFERER", "REQUEST", "IP_JSON"],[Stringify(json), Stringify(Platform.Request.ReferrerURL), Stringify(Platform.Request), Stringify(ipJson)]);
      //json Form variables
      var email_address = json.email_address;
      // Validate Email Address
      if (validateEmailAddress(email_address) != "True"){
        throw Stringify("wrong email");
        return;
      }
      var iframesrc = json.iframesrc;
      var countryCode = json.countryCode;
      var languageCode = json.languageCode;
      var need_double_optin = json.need_double_optin;
      var last_product = json.last_product;
      var variant = json.variant;
      var brand = json.brands;
      //derived variables
      var first_name = 'UNDEFINED';
      var last_name = 'UNDEFINED';
      var ip_country = ipJson.countryCode;
      if(email_address.indexOf("jguaquetarestrepo@rccl.com") != -1 || email_address.indexOf("m_a15@hotmail.es") != -1 ){
        ip_country = "US"
      }
      
      ip_country = "US"
      var guid = Platform.Function.GUID();
      var created = new Date();
      var email_consent = 'UNDEFINED';
      var phone_consent = 'UNDEFINED';
      var triggeredSendExternalKey = 'Promo_Email_Capture_Test';
      var currentLocalTime = Platform.Variable.GetValue("@currentLocalTime");
      //currentLocalTime = currentLocalTime.setHours(currentLocalTime.getHours() - 4);
      //derive promoCode
      var rowsDE = DataExtension.Init("Promo_Calendar");
      var filter1 = {
        Property: "EMAIL_PROGRAM", 
        SimpleOperator: "equals", 
        Value: "PromoEmailCapture" 
      };
      var filter2 = {
        Property: "START_DT",  
        SimpleOperator: "lessThanOrEqual",
        Value: currentLocalTime
      };
      var filter3 = {
        Property: "END_DT",
        SimpleOperator: "greaterThan",
        Value: currentLocalTime
      };
      var filter23 = {
        LeftOperand: filter2,
        LogicalOperator: "AND",
        RightOperand: filter3
      };
      var complexFilter = {
        LeftOperand: filter1,
        LogicalOperator: "AND",
        RightOperand: filter23
      };
      var moredata = rowsDE.Rows.Retrieve(complexFilter);
      var promoCode = moredata[0].PROMO_CODE;
      var promoStartDt = moredata[0].START_DT;
      var promoEndDt = moredata[0].END_DT;
      //Convert country code to 3 char 
      var conv_country_code = Platform.Function.Lookup('COUNTRY_CODE_CNTL', 'COUNTRY_CODE', 'COUNTRY_ISO2_CODE', ip_country);
      if (conv_country_code == null) {
        conv_country_code = ip_country}
      //Insert data into GDPR DE
      //tri-branded optin   
      for (var i = 0; i < brand.length; i++) {
        if (brand[i] == "C"){
          var rows = Platform.Function.InsertData("CEL_GET_ROYAL_DEALS_SUBSCRIBERS_DEV",["FIRST_NAME","LAST_NAME","COUNTRY","CREATED","PAGE_SOURCE","EMAIL_ADDRESS","GUID","LAST_PRODUCT","LANGUAGE","EMAIL_CONSENT","PHONE_CONSENT","NEED_DOUBLE_OPTIN","PGM_SOURCE"],
                                                  [first_name,last_name,ip_country,created,iframesrc,email_address,Platform.Function.GUID(),last_product,languageCode,email_consent,phone_consent,need_double_optin,"TriBrandedOptin"]);
        }
        if (brand[i] == "S"){
          var rows = Platform.Function.InsertData("SS_GET_ROYAL_DEALS_SUBSCRIBERS_DEV",["FIRST_NAME","LAST_NAME","COUNTRY","CREATED","PAGE_SOURCE","EMAIL_ADDRESS","GUID","LAST_PRODUCT","LANGUAGE","EMAIL_CONSENT","PHONE_CONSENT","NEED_DOUBLE_OPTIN","PGM_SOURCE", "VARIANT"],
                                                  [first_name,last_name,ip_country,created,iframesrc,email_address,Platform.Function.GUID(),last_product,languageCode,email_consent,phone_consent,need_double_optin,"TriBrandedOptin", variant]);
        }
      }
      //promo submit
      if (!brand){
        var rows = Platform.Function.InsertData("GET_ROYAL_DEALS_SUBSCRIBERS_DEV",["FIRST_NAME","LAST_NAME","COUNTRY","CREATED","PAGE_SOURCE","EMAIL_ADDRESS","GUID","LAST_PRODUCT","LANGUAGE","EMAIL_CONSENT","PHONE_CONSENT","NEED_DOUBLE_OPTIN","PGM_SOURCE", "VARIANT"],
                                                [first_name,last_name,ip_country,created,iframesrc,email_address,guid,last_product,languageCode,email_consent,phone_consent,need_double_optin,"PromoEmailCapture", variant]);
        var doiList = Platform.Function.Lookup('List_DOI_Countries','COUNTRY','COUNTRY',ip_country);
        if (doiList != null) {
          var insertDachOptIn = Platform.Function.InsertData("DACH_PromoEmailCapture_Stack_DEV",["GUID","EMAIL","COUNTRY"],[guid,email_address,ip_country]);
        }
        else if (ip_country == "US" || ip_country == "CA"){
          //-------------------------------------------------------
          var uniqueOfferCode = getUniqueOfferCode(email_address);
          var data = {
          };
          if (uniqueOfferCode != 0 ){
            data = {
              SubscriberKey: guid,
              promoCode: uniqueOfferCode,
              startDt: promoStartDt,
              endDt: promoEndDt,
              cntry: conv_country_code,
              Country_Code: ip_country,
              FirstName: first_name,
              EmailAddress: email_address,
              LanguageCode: languageCode,
              variant:variant,
              brand:brand,
              path:'TO'
            }
          }
          else{
            data = {
              SubscriberKey: guid,
              promoCode: uniqueOfferCode,
              startDt: promoStartDt,
              endDt: promoEndDt,
              cntry: conv_country_code,
              Country_Code: ip_country,
              FirstName: first_name,
              EmailAddress: email_address,
              LanguageCode: languageCode,
              variant:variant,
              brand:brand,
              path: 'NON_TO'
            }
          }
          // ------ JOURNEY API CONNECTION
          try {
            /* TOKEN RETRIEVAL */
            var tokenDE = DataExtension.Init("PEC_TOKEN_STORAGE");
            var tokenRow = tokenDE.Rows.Lookup(["index"], [0]);
            var token;
            if(tokenRow && tokenRow.length > 0){
              token = tokenRow[0].access_token;
            }
            else{
              token = getToken(setup);
              Platform.Function.InsertData("PEC_TOKEN_STORAGE", ["access_token","index"], [token, 0]);
            }
            /* END TOKEN RETRIEVAL */
            var success = false;
            if(!!token){
              try{
                success = triggerEvent(token, setup, data);
                if (!!success) Platform.Function.InsertData("PEC_journeyAPI_errorLog", ["Error","EmailAddress"], ["Subscriber was successfully injected into the Journey. (1)", email_address]);
                
              }
              catch(err2){
                //              Write("Error: " + Stringify(err2));
                Platform.Function.InsertData("PEC_journeyAPI_errorLog", ["Error","EmailAddress"], ["catch: err2:" + Stringify(err2), email_address]);
                token = getToken(setup);
                if (!!token){
                  Platform.Function.DeleteData("PEC_TOKEN_STORAGE", ["index"], [0]);
                  Platform.Function.InsertData("PEC_TOKEN_STORAGE", ["access_token","index"], [token, 0]);
                  success = triggerEvent(token, setup, data);
                  if (!!success) Platform.Function.InsertData("PEC_journeyAPI_errorLog", ["Error","EmailAddress"], ["Subscriber was successfully injected into the Journey. (2)", email_address]);
                }
                throw "Error";
              }
            }
          }
          catch (err) {
            //Write("Error: " + Stringify(err));
            Platform.Function.InsertData("PEC_journeyAPI_errorLog", ["Error","EmailAddress"], ["catch: err:" + Stringify(err), email_address]);
          }
          // ------ END JOURNEY API CONNECTION
          //-------------------------------------------------------
        }
        else{
          //IF CNTRY CODE IS ANY OTHER EXCEPT FROM 2 OPT IN COUNTRIES OR DOMESTIC
          //Trigger Send POP-UP
          var data = {
            attributes: {
              PromoCode: promoCode,
              startDt: promoStartDt,
              endDt: promoEndDt,
              cntry: conv_country_code,
              Country_Code: ip_country,
              LanguageCode: languageCode
            }
            ,
            subscriber: {
              EmailAddress: email_address,
              SubscriberKey: guid
            }
          }
          var TSD = TriggeredSend.Init(triggeredSendExternalKey);
          var Status = TSD.Send(data.subscriber, data.attributes);
          if (Status != "OK") {
            throw Stringify(Status);
          }
        }
        //end of promo submit           
        Write(Platform.Function.Stringify({
          "response": "success" }
                                         ));
      }
    }
    else {
      throw "Wrong origin";
    }
  }
  catch (e) {
    Write(Stringify(e));
    Platform.Response.Write( Platform.Function.Stringify({
      "response":"fail"}
                                                        ));
    //var debug = Platform.Function.InsertData("PromoCode_Debugging",["TYPE"],[e]); 
  }
  /*FUNCTIONS*/
  function validateEmailAddress(emailAddress) {
    Variable.SetValue("@emailAddress", emailAddress)
    var scr = "";
    scr += "\%\%[";
    scr += "set @validEmail = IsEmailAddress(@emailAddress)";
    scr += "Output(Concat(@validEmail))";
    scr += "]\%\%";
    return Platform.Function.TreatAsContent(scr);
  }
  function getUniqueOfferCode(emailAddress) {
    Variable.SetValue("@emailAddress", emailAddress)
    var scr = "";
    scr += "\%\%[";
    scr += "  set @claimedDate = Lookup('PEC_UNIQUE_OFFER_CODES', 'ClaimedDate', 'EmailAddress', @emailAddress)";
    scr += "  IF empty(@claimedDate) THEN";
    scr += "  set @couponCodeRow = ClaimRow('PEC_UNIQUE_OFFER_CODES','IsClaimed','EmailAddress',@emailAddress)";
    scr += "  set @couponCode = Field(@couponCodeRow,'CouponCode')";
    scr += "  Output(Concat(@couponCode))";
    scr += "  ELSE";
    scr += "  SET @monthDiff = DateDiff(NOW(), @claimedDate, 'D')"; //Change to 1 day
    scr += "  IF @monthDiff > 0 THEN"; // Greather tan  1 day for testing
    scr += "  set @couponCodeRow = ClaimRow('PEC_UNIQUE_OFFER_CODES','IsClaimed','EmailAddress',@emailAddress)";
    scr += "  set @couponCode = Field(@couponCodeRow,'CouponCode')";
    scr += "  Output(Concat(@couponCode))";
    scr += "  ELSE";
    scr += "  Output('0')";
    scr += "  set @couponCode = '0'";
    scr += "  ENDIF ENDIF";
    scr += "]\%\%";
    Platform.Function.TreatAsContent(scr);
    return Variable.GetValue("@couponCode");
  }
  function getToken(setup) {
    var config = {
      url : setup.authBaseURI + "v2/token",
      contentType : "application/json",
      payload : {
        "client_id": setup.clientId,
        "client_secret": setup.clientSecret,
        "grant_type": "client_credentials"
      }
    }
    var req = HTTP.Post(config.url, config.contentType, Stringify(config.payload));
    if (req.StatusCode == 200) {
      var res = Platform.Function.ParseJSON(req.Response[0]);
      return res.access_token;
    }
    else {
      return false;
    }
  }
  function triggerEvent(token, setup, data) {
    var config = {
      url : setup.restBaseURI + "interaction/v1/events",
      contentType : "application/json",
      headerName : ["Authorization"],
      headerValue : ["Bearer " + token],
      payload : {
        ContactKey: data.SubscriberKey,
        EventDefinitionKey: setup.eventDefinitionKey,
        Data: data
      }
    }
    //Write(Stringify(config));
    var req = HTTP.Post(config.url, config.contentType, Stringify(config.payload), config.headerName, config.headerValue);
    //Write(Stringify(req));
    if (req.StatusCode == 201) {
      var res = Platform.Function.ParseJSON(req["Response"][0]);
      if (res.eventInstanceId != null && res.eventInstanceId != "") return true;
    }
    else {
      return false;
    }
  }
  
  function decryptSymmetric(str) {

    Variable.SetValue("@ToDecrypt", str)

    var scr = "";
        scr += "\%\%[";
        scr += "SET @Decrypted = DecryptSymmetric(@ToDecrypt, 'des;mode=ecb;padding=zeros', 'WebEncryptionEmail', @null, @null, @null, @null, @null)";
        scr += "Output(Concat(@Decrypted))";
        scr += "]\%\%";

    return Platform.Function.TreatAsContent(scr);
}
</script>