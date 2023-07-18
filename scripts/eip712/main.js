const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { wallets } = require('../../wallets/public.js')
const {parseSignature} = require('../../utils/common')
const ethers = require('ethers');
const provider = new ethers.providers.StaticJsonRpcProvider("https://eth-goerli.alchemyapi.io/v2/GlaeWuylnNM3uuOo-SAwJxuwTdqHaY5l")

const privateKey = '0x503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb'
const wallet = new ethers.Wallet(privateKey, provider)
main()
async function main() {
    console.log(`start.`)
    // Create from EIP712 Domain
    let contractName = "EIP712Storage"
    let version = "1"
    let chainId = "5"
    let contractAddress = "0xf8e81D47203A594245E36C48e151709F0C19fBe8"

    const domain = {
        name: contractName,
        version: version,
        chainId: chainId,
        verifyingContract: contractAddress,
    };

    // Create data，Storage
    let spender = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
    let number = "100"

    const types = {
        Storage: [
            { name: "spender", type: "address" },
            { name: "number", type: "uint256" },
        ],
    };

    const message = {
        spender: spender,
        number: number,
    };
    // EIP712 signature
    const signature = await wallet._signTypedData(domain, types, message);
    console.log(`Signature: ${signature}`);

    // Get r,s,v from signature
    let {r,s,v} = parseSignature(signature)
    console.log(`r: ${r}, s: ${s}, v:${v}`)

    // Verify the EIP712 signature, and recover the signer address from the signature and message
    let eip712Signer = ethers.utils.verifyTypedData(domain, types, message, signature)
    console.log("EIP712 Signer: ", eip712Signer)
}

