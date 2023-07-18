const { airdrops } = require('../../wallets/public.js')
const ethers = require('ethers')
var colors = require('colors');
colors.enable()
const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { ZksyncEra } = require("@thirdweb-dev/chains");

// For SELL contract
const abiErc20 = require("../../abis/erc-20.json")
const classicPoolFactoryAbi = require("../../abis/syncswap/SyncSwapClassicPoolFactory.json")
const poolAbi = require("../../abis/syncswap/SyncSwapClassicPool.json")
const routerAbi = require("../../abis/syncswap/SyncSwapRouter.json");
const { exit } = require('process');
const provider = new ethers.providers.StaticJsonRpcProvider("https://zksync2-mainnet.zksync.io")

// const provider = new ethers.providers.StaticJsonRpcProvider("https://scroll-testnet.blockpi.network/v1/rpc/public	")

let wallets = []
Object.keys(airdrops).forEach(k => {
    wallets.push(new ethers.Wallet(airdrops[k], provider))
    
})

const classicPoolFactoryAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb"
const routerAddress = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

main()
async function main() {
    console.log(`start.`)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC ERA-----.`.green)
    console.log(`1. Swap ETH to USDC/TOKEN-CONTRACT/....`)
    console.log(`2. Swap USDC to ETH`)
    console.log(`3. Approval USDC for SELL ERC-ETH`)
    console.log(`4. Swap ETH to Custom contract`)
    console.log(`5. Claim NFT on ReWiki`)

    console.log(`0. Exit`)

    let nameFeature = features.question("Choose your features: ".green);
    let txn = features.question("Number txn batch run: ")
    let batch = 1
    let excludeCA = false;
    let customCA

    while (batch <= txn) {
       
        try {
            console.log(`---BATCH NUMBER TXN: ${batch}.`)
            for (let i = 0; i < wallets.length; i++) {
                let wallet_address = await wallets[i].getAddress()
                console.log(`Handing address: ${wallet_address}`);
                try {
                    switch (nameFeature) {
                        case '1':
                            taskSyncswap(wallets[i])
                            await sleep(getRandomInt(5000, 10000))

                            break;
                        case '2':
                            console.log(`Waiting transaction: ${wallet_address}`);
                            taskSyncswapToETH(wallets[i])
                            break;
                        case '3':
                            approvalUSDC(wallets[i])
                            break;
                        case '4':
                            // RANDOM ETH Value covert
                            if(excludeCA == false){
                                customCA = features.question("Fill custom contract (N: Non-Contract): ");
                                if(customCA == "N".toLowerCase()) excludeCA = true;
                            }  

                            const value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 6).toFixed(9) + '')
                            console.log("Value ETH Random (Value from 0.01 to 0.02$): "+value/(10**18))

                            /*
                            * CA ETH: 0x5aea5775959fbc2557cc8789bc1bf90a239d9a91
                            * CA USDC: 0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4
                            */
                            if(!(excludeCA) || excludeCA == false )
                                await swapETHForErc20(wallets[i], "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", customCA, value)
                            else
                                await swapETHForErc20(wallets[i], "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xdd9f72afED3631a6C85b5369D84875e6c42f1827", value)
                            break;
                        
                        case '5':
                            claimReNFT(wallets[i])
                            break;    
                        
                        default:
                            break;
                    }
                    console.log(`---End batch ${batch}---.`)
                   
                } catch (e) {
                    console.log(`error on handing ${wallet_address}`)
                    console.log(e)
                }
            }
            console.log(`---BATCH NUMBER: ${batch}.`)

            batch ++;
            await sleep(getRandomInt(5000, 8000))
            console.log(`Resting....`)

        } catch(e) {
            console.log(`${e}`)
        }
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
async function taskSyncswapToETH(wallet){

    // GET CONTRACT AND BACKSWAP SELL
    const erc20Contract = new ethers.Contract(
        "0xafDB096e62A41371c9cf466ae4980a34A214036b",
        abiErc20,
        wallet
    );

    let balanceOfErc20 = await erc20Contract.balanceOf(await wallet.getAddress())

    console.log(`Waiting transaction: ${wallet}`);
    await (swapErc20ForETH(wallet, "0xafDB096e62A41371c9cf466ae4980a34A214036b", "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", balanceOfErc20))

}
async function approvalUSDC(wallet){

    // GET CONTRACT FOR APPROVAL
    const erc20Contract = new ethers.Contract(
        "0xafDB096e62A41371c9cf466ae4980a34A214036b",
        abiErc20,
        wallet
    );
    let allowance = await erc20Contract.allowance(await wallet.getAddress(), routerAddress)
    console.log(`Waiting transaction approval: ${wallet} allowance: ${allowance}`);

    if (allowance.eq(0)) {
        let res = await erc20Contract.approve(routerAddress, ethers.constants.MaxUint256)
        res.wait()
    }
}

async function taskSyncswap(wallet) {

    // RANDOM ETH Value covert
    const value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 6).toFixed(9) + '')

    console.log("Value ETH: "+value/(10**18))

    /*
    * INPUT CONTRACT ETH & CONTRACT ERC2
    * CA ETH: 0x5aea5775959fbc2557cc8789bc1bf90a239d9a91
    * CA USDC: 0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4
    */
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x0e97C7a0F8B2C9885C8ac9fC6136e829CbC21d42", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xdd9f72afED3631a6C85b5369D84875e6c42f1827", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xd599dA85F8Fc4877e61f547dFAcffe1238A7149E", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xD0eA21ba66B67bE636De1EC4bd9696EB8C61e9AA", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x47260090cE5e83454d5f05A0AbbB2C953835f777", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x85D84c774CF8e9fF85342684b0E795Df72A24908", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x787c09494ec8bcb24dcaf8659e7d5d69979ee508", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x493257fd37edb34451f62edf8d2a0c418852ba4c", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x5756A28E2aAe01F600FC2C01358395F5C1f8ad3A", value)

    
    
    
}

async function swapETHForErc20(wallet, wETHAddress, erc20Address, amountIn) {
    try{
           // The factory of the Classic Pool.
        const classicPoolFactory = new ethers.Contract(
            classicPoolFactoryAddress,
            classicPoolFactoryAbi,
            wallet
        );

        // Gets the address of the ETH/DAI Classic Pool.
        // wETH is used internally by the pools.
        const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

        // Checks whether the pool exists.
        if (poolAddress === ZERO_ADDRESS) {
            throw Error('Pool not exists');
        }

        // Gets the reserves of the pool.
        const pool = new ethers.Contract(poolAddress, poolAbi, provider);
        const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

        // Sorts the reserves by token addresses.
        const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

        // The input amount of ETH
        const value = amountIn
        const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
        const addressWallet = await wallet.getAddress()
        const swapData = ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint8"],
            [wETHAddress, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
        );

        // We have only 1 step.
        const steps = [{
            pool: poolAddress,
            data: swapData,
            callback: ZERO_ADDRESS, // we don't have a callback
            callbackData: '0x',
        }];

        // Note: however we still have to encode the wETH address to pool's swap data.
        const nativeETHAddress = ZERO_ADDRESS;

        // We have only 1 path.
        const paths = [{
            steps: steps,
            tokenIn: nativeETHAddress,
            amountIn: value,
        }];

        // Gets the router contract.
        const router = new ethers.Contract(routerAddress, routerAbi, wallet);
        // console.log(`${minAmountOut}`)
        // Note: checks approval for ERC20 tokens.
        // The router will handle the deposit to the pool's vault account.
        const response = await router.swap(
            paths, // paths
            0, // amountOutMin // Note: ensures slippage here
            ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
            {
                value: value,
                gasLimit: 800000,
                gasPrice: ethers.utils.parseUnits('0.261', 'gwei')

            }
        );
        
        console.log(`Waiting transaction from: ${addressWallet}`.green);

        return await response.wait();
        
    }
    catch(error) {
        console.error(error);
    }
}


async function swapErc20ForETH(wallet, erc20Address, wETHAddress, amountIn) {
    try{
        // The factory of the Classic Pool.
        const classicPoolFactory = new ethers.Contract(
            classicPoolFactoryAddress,
            classicPoolFactoryAbi,
            wallet
        );

        // Gets the address of the ETH/DAI Classic Pool.
        // wETH is used internally by the pools.
        const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

        // Checks whether the pool exists.
        if (poolAddress === ZERO_ADDRESS) {
            throw Error('Pool not exists');
        }

        // Gets the reserves of the pool.
        const pool = new ethers.Contract(poolAddress, poolAbi, provider);
        const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

        // Sorts the reserves by token addresses.
        // const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

        // The input amount of ETH
        const value = amountIn
        // const minAmountOut = getAmountOut(value, reserveErc20, reserveETH)

        // Constructs the swap paths with steps.
        // Determine withdraw mode, to withdraw native ETH or wETH on last step.
        // 0 - vault internal transfer
        // 1 - withdraw and unwrap to naitve ETH
        // 2 - withdraw and wrap to wETH
        const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet

        const swapData = ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint8"],
            [erc20Address, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
        );

        // We have only 1 step.
        const steps = [{
            pool: poolAddress,
            data: swapData,
            callback: ZERO_ADDRESS, // we don't have a callback
            callbackData: '0x',
        }];

        // We have only 1 path.
        const paths = [{
            steps: steps,
            tokenIn: erc20Address,
            amountIn: value,
        }];

        // Gets the router contract.
        const router = new ethers.Contract(routerAddress, routerAbi, wallet);
        // console.log(`${minAmountOut}`)
        // Note: checks approval for ERC20 tokens.
        // The router will handle the deposit to the pool's vault account.
        // GAS: 800000 Staturday
        const response = await router.swap(
            paths, // paths
            0, // amountOutMin // Note: ensures slippage here
            ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
            {
                gasLimit: 800000,
                gasPrice: ethers.utils.parseUnits(0.25, 'gwei')

            }
        );

        await response.wait();
    }
    catch(error) {
        console.error(error);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(3);
};


async function claimReNFT(wallet) {

      // Claim NFT
      const sdk = ThirdwebSDK.fromPrivateKey(
        wallet, // 
        ZksyncEra
      );
      
      const claimToAddress = await wallet.getAddress()
      const CONTRACT_ADDRESS = '0xbBB3C56f0Ee015990e86A44a5FB5a8d33462200c'

      const contract = await sdk.getContract(CONTRACT_ADDRESS);
      const txResult = await contract.erc721.claimTo(claimToAddress, 10);
      console.log(
        "Address Claimed: ",
        claimToAddress,
        "tx",
        txResult.at(0).receipt.transactionHash
      );
}
  