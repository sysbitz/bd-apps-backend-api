
<?php

ini_set('error_log', 'sms-app-error.log');
require 'bdapps_cass_sdk.php';


$appid = "APP_010000";
$apppassword = "569f9edcb7f5753d47ceb13722065566";
$logger = new Logger();



$cass = new DirectDebitSender("https://developer.bdapps.com/caas/direct/debit",$appid,$apppassword);
$sender = new SmsSender("https://developer.bdapps.com/sms/send", $appid,$apppassword);


try {
    
       
        $address="tel:8801847026**";
    $chargeAmount=2;
        
		 $status  = $cass->cass("123456",$address,$chargeAmount); 
         file_put_contents('USSDERROR.txt',$status);   

     
            if($status==="S1000"){
                
                 $sender->sms($productId." Purchase Successful",$address);
            }
            
        
        }
         
		
	 catch (CassException $e) {
		$sender->sms("You do not have money ",$address);
       //$status =  e->getStatusCode();
    
	}


catch (Exception $e) {
	
}



?>