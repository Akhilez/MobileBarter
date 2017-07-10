pragma solidity ^0.4.4;
contract MobileBarter {

  address public organizer;
  address public speaker;
  
	mapping (uint => address) public userAddresses;
	mapping (uint => uint) public userBalances;
	
	uint public numUsers;

	uint public requestingNumber;


  function MobileBarter(address speakaddr) {
    organizer = msg.sender;
    speaker=speakaddr;
		numUsers = 0;
		requestingNumber = 0;
  }
  
  function addAccount(address MobileOwner, uint mobileNumber, uint balance) public returns (bool success) {
			if (msg.sender != organizer) { return; }
			userAddresses[mobileNumber]=MobileOwner;
			userBalances[mobileNumber] = balance;
		  numUsers += 1;
			return true;
	}

	function callAndTalk(uint mobileNo, uint duration) public returns (bool success){
			if (msg.sender != organizer) { return; }
			userBalances[mobileNo] -= duration;
			return true;
 }

	function requestTalktime(uint mobileNumber)public returns (bool success){
			 if (msg.sender != organizer) { return; }
				requestingNumber = mobileNumber;
				return true;
		}

		function transferTalktime(uint mobileNo, uint talktime) public returns (bool success){
				if (msg.sender != organizer) { return; }
				if(requestingNumber != 0){
						userBalances[mobileNo] -= talktime;
						userBalances[requestingNumber] += talktime;
						requestingNumber = 0;
				}
				return true;
		}

}//end of barter

