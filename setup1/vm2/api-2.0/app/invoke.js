const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')
const helper = require('./helper')
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://3.21.33.67:1234');
// const createTransactionEventHandler = require('./MyTransactionEventHandler.ts')

var org_name='';
var username='';
var chaincodeName='';
var channelName='';
var fcn='';
var args='';
var args1='';
var args2='';
var args3='';
var args4='';

var topic = 'fabric'
client.on('connect', () => {

    client.subscribe(topic)

})
client.on('message', (topic, message) => {

    var data = JSON.parse(message)

    org_name = data.orgname;
    username = data.username;
    chaincodeName = data.chaincodeName;
    channelName = data.channelName;
    fcn = data.fcn;
    args = data.args[0];
    args1 = data.args[1];
    args2= data.args[2];
    args3 = data.args[3];

})

const invokeTransaction = async () => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name)
        const walletPath = await helper.getWalletPath(org_name) 
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        let identity = await wallet.get(username);
        if (!identity) {
            console.log(` ${username} adlı kullanıcının kaydı bulunamadı, lütfen kayıt edin.`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            return;
        }
        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: false },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);
        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        let result
        let message;
        if (fcn === "createProduct") {
            result = await contract.submitTransaction(fcn, args, args1, args2, args3);
            message = `Successfully added the product asset with key ${args}`

        }else if (fcn === "changeProductStatus") {
            result = await contract.submitTransaction(fcn, args, args1);
            message = `Successfully changed product status with key ${args}`

        }else if (fcn === "createSensorData") {
            args4=username
            result = await contract.submitTransaction(fcn, args, args1, args2, args3, args4);
            message = `Successfully added the sensor asset with key ${args}`

        }else if (fcn === "changeSensorData") {
            result = await contract.submitTransaction(fcn, args, args1, args2, args3);
            message = `Successfully updated sensor values with key ${args}`

        }
        else {
            return `Invocation require either createProduct or changeProductStatus as function but got ${fcn}`
        }
        await gateway.disconnect();

        let response = {
            message: message
        }

        /*org_name='';
        username='';
        chaincodeName='';
        channelName='';
        fcn='';
        args='';
        args1='';
        args2='';
        args3='';
        args4='';*/

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }

}

exports.invokeTransaction = invokeTransaction;
