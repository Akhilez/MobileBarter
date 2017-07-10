// Import the page's CSS. Webpack will know what to do with it.
//import "../stylesheets/app.css";

// Import libraries we need.
import {
    default as Web3
} from 'web3';
import {
    default as contract
} from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import conference_artifacts from '../../build/contracts/MobileBarter.json'

// MobileBarter is our usable abstraction, which we'll use through the code below.
var MobileBarter = contract(conference_artifacts);

var accounts, account, speaker;
var barter;


function getBalance(address) {
    return web3.fromWei(web3.eth.getBalance(address).toNumber(), 'ether');
}


var allUsers = new Set();
var nonRequestingUsers = [];
var html1 = "";
var userAddresses = {};
var userBalances = {};
var addedAddresses = [];
var minBalance = 10;
var requestingNumber;


window.App = {
    start: function() {
        var self = this;


        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                alert("There was an error fetching your accounts.");
                return;
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                return;
            }

            accounts = accs;
            //console.log(accounts);
            account = accounts[0];
            speaker = accounts[9];

            self.initializeConference();
						refreshAddress();
						refreshMobileDropDown();

        });
    }, //end of start

		initializeConference: function(){
				var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            $("#confAddress").html(barter.address);
						
        }).catch(function(e) {
            console.log(e);
        });
		},

		addAccount: function(mobileAddress, mobileNo, initialBalance){
				if(addedAddresses.indexOf(mobileAddress) >= 0 || allUsers.has(mobileNo)){
							displayMessage("addAccountResult","Account already added!","danger");
							return;
				}
				if(allUsers.size == 8){
						displayMessage("addAccountResult","Maximum account limit reached","danger");
						return;
				}
				var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            barter.addAccount(mobileAddress, mobileNo, initialBalance, {from: accounts[0]})
						.then( function(){
								allUsers.add(mobileNo);
								addedAddresses.push(mobileAddress);
								refreshAddress();
								refreshMobileDropDown();
								displayMessage("addAccountResult","Added "+mobileNo+" mobile number at "+mobileAddress+" address with "+initialBalance+" ether(s) ", "success");
						});
        }).catch(function(e) {
            console.log(e);
        });
		},

		callAndTalk: function(mobileNo, duration){
			var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
						barter.userBalances.call(mobileNo).then(function(bal){
								if(duration > bal.toNumber()) return false;
								return true;
						}).then(function(permitted){
								if(permitted)
									barter.callAndTalk(mobileNo, duration, {from: accounts[0]}).then(
										function(){
												displayMessage("callAndTalkResult", "Call charged "+duration+" ether(s)", "success");
												App.refreshLowBalanceNo();
										}						
									);
								else displayMessage("callAndTalkResult", "Insufficient talktime", "danger");
						});
        }).catch(function(e) {
            console.log(e);
        });
		},
		requestBalance: function(mobileNo){
			var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            barter.requestTalktime(mobileNo, {from: accounts[0]}).then(
							function(){
									return barter.requestingNumber.call();
							}						
						).then(function(num){
								displayMessage("requestTalktimeResult", "Request sent!", "success");
								displayMessage("xIsRequesting", num+" mobile number is requesting for talktime!", "info");
								requestingNumber = num;
								App.refreshHighBalanceNo();
						});
        }).catch(function(e) {
            console.log(e);
        });
		},
		transferBalance: function(mobileNo,balance){
      var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
						barter.userBalances.call(mobileNo).then(function(bal){
								if(balance <= bal - minBalance){
										barter.transferTalktime(mobileNo, balance, {from: accounts[0]}).then(function(){
													displayMessage("transferTalktimeResult", "Transferring "+balance+" ether(s) talktime from "+mobileNo+" to "+requestingNumber, "success");
													$("#historyTable").append("<tr><td>"+mobileNo+"</td> <td>"+requestingNumber+"</td> <td>"+balance+"</td></tr>");
										});
								}else displayMessage("transferTalktimeResult", "Minimum talktime reached. Cannot transfer", "danger");
						});
        }).catch(function(e) {
            console.log(e);
        });
		},

		updateTable: function(){
				if(allUsers.size == 0) return;
				html1 = "<tr><th>Mobile Number</th><th>Owner Address</th><th>Balance Talktime</th></tr>";
				for(const mobNo of allUsers){
						html1 += " <tr> <td>"+mobNo+"</td> <td> "+ userAddresses[mobNo] +" </td> <td>"+userBalances[mobNo]+"</td> </tr>"
				}	
				$("#accountsTable").html(html1);
		},

		userInfoToLocal: function(){
				var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            for(const mobNo of allUsers){
								barter.userAddresses.call(mobNo).then(function(addr){
										userAddresses[mobNo] = addr;
								}).then(function(){
										barter.userBalances.call(mobNo).then(function(bal){
												userBalances[mobNo] = bal;
												App.updateTable();
										});
								});
						}

        }).catch(function(e) {
            console.log(e);
        });

		},

		refreshLowBalanceNo: function(){
				$("#requestingMobileNumber").html("");
				var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            allUsers.forEach(function myFunction(item, index){
								barter.userBalances.call(item).then(function(bal){
										if(bal<minBalance){
												$("#requestingMobileNumber").append("<option value='"+item+"'>"+item+"</option>");
										}
								});
						});

        }).catch(function(e) {
            console.log(e);
        });
		},

		refreshHighBalanceNo: function(){
				$("#chooseMobileNumber").html("");
				var self = this;
        MobileBarter.deployed().then(function(instance) {
            barter = instance;
            allUsers.forEach(function myFunction(item, index){
								barter.userBalances.call(item).then(function(bal){
										if(bal>=minBalance){
												$("#chooseMobileNumber").append("<option value='"+item+"'>"+item+"</option>");
										}
								});
						});

        }).catch(function(e) {
            console.log(e);
        });
		}

};



window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    MobileBarter.setProvider(web3.currentProvider);
    App.start();
		

    // Wire up the UI elements
   	$("#addAccountButton").click(function() {
			var mobileNo = $("#addmobileNumber").val();
			var mobileAddress = $("#addmobileOwner").val();
			var initialBalance = $("#addinitialTalktime").val();
			if(mobileNo < 1000000000) displayMessage("addAccountResult", "Enter a valid mobile number", "danger");
			else if(initialBalance <1)
					displayMessage("addAccountResult", "Enter valid talktime","danger");
			else
					App.addAccount(mobileAddress, mobileNo, initialBalance);
		});

	 $("#callAndTalkButton").click(function() {
			var mobileNo = $("#callFromMobileNumber").val();
			var duration = $("#callDuration").val();
			if(duration<1) displayMessage("callAndTalkResult", "Enter valid duration", "danger");
			else App.callAndTalk(mobileNo,duration);
		});

		$("#requestingMobileButton").click(function() {
			var mobileNo = $("#requestingMobileNumber").val();
			
			App.requestBalance(mobileNo);
		});

		$("#transferTalktimeButton").click(function() {
			var mobileNo = $("#chooseMobileNumber").val();
			var balance =$("#Talktime").val();
			App.transferBalance(mobileNo,balance);
		});
    
		$("#refreshTable").click(function(){
				App.updateTable();
		});

		$("button").click(function(){
				App.userInfoToLocal();
		});
    

});

function refreshAddress(){
	$("#addmobileOwner").html("");
	accounts.forEach(function myFunction(item, index){
		if(index!=0 && index!=9 && addedAddresses.indexOf(item) == -1){
			$("#addmobileOwner").append("<option value='"+item+"'>"+item+"</option>");
		}
	});
}

function refreshMobileDropDown(){
	$("#callFromMobileNumber").html("");
	allUsers.forEach(function myFunction(item, index){
		if(true){
			$("#callFromMobileNumber").append("<option value='"+item+"'>"+item+"</option>");
		}
	});
}

		
function displayMessage(id, message, type){
		$("#"+id).html(
				"<div class='alert alert-"+type+"'>"+message+"</div>"
		);
}









