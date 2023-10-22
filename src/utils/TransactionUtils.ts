import { ethers } from "ethers"
import EthersAdapter from '@safe-global/safe-ethers-lib'
import Safe, { SafeFactory, SafeAccountConfig } from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types"
import SafeServiceClient from '@safe-global/safe-service-client'

declare global {
    interface Window {
        ethereum:any
    }
}

export class TransactionUtils {
    
    static getEthAdapter =async (useSigner:boolean = true) => {
        if(!window.ethereum){
            throw new  Error("No crypt wallet found");
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        let signer;

        if(useSigner){
            await window.ethereum.send("eth_requestAccounts")
            signer = provider.getSigner()
        }

        console.log({provider, signer})
        console.log("deploying safe")

        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer || provider
        })

        return ethAdapter;
        
    }

   
    static createMultisigWallet =  async (owners: Array<string>, threshold: number) => {
        console.log(owners, threshold)
        const ethAdapter = await this.getEthAdapter();

        const safeFactory =  await SafeFactory.create({ethAdapter})
        console.log({ethAdapter, safeFactory})

        const safeAccountConfig : SafeAccountConfig = {
            owners, 
            threshold
        }

        const safe : Safe = await safeFactory.deploySafe({safeAccountConfig})

        const safeAddress = safe.getAddress()

        console.log(safeAddress)
        console.log(`sepolia.etherscan.io/tx/${safeAddress}`)
        
        


        return {safe}
    }
 
    static createTransaction = async (safeAddress: string, destination: string, amount: number|string) => {
        amount = ethers.utils.parseUnits(amount.toString(), 'ether').toString()


        const safeTransactionData : SafeTransactionDataPartial = {
            to : destination,
            data : '0x',
            value : amount
        }

        const ethAdapter = await this.getEthAdapter();
        const safeSDK = await Safe.create({
            ethAdapter,
            safeAddress,
        })


        const safeTransaction = await safeSDK.createTransaction({safeTransactionData})

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)


        const senderSignature  = await safeSDK.signTransactionHash(safeTxHash)

        const txServiceUrl = 'https://safe-transaction-zkevm.safe.global'
        const safeService = new SafeServiceClient({txServiceUrl , ethAdapter})

        await safeService.proposeTransaction({
            safeAddress,
            safeTransactionData : safeTransaction.data,
            safeTxHash,
            senderAddress : (await ethAdapter.getSignerAddress())!,
            senderSignature : senderSignature.data
        })


        console.log(`Transaction sent to safe service : https://safe-transaction-zkevm.safe.global//api/v1/multisig-transactions/${safeTxHash}`)
    }

    static confirmTransaction = async (safeAddress: string, safeTxHash: string) => {
        const ethAdapter  = await this.getEthAdapter();
        const safeService = new SafeServiceClient({txServiceUrl : '' , ethAdapter})

        const safeSDK = await Safe.create(
            {
                ethAdapter,
                safeAddress
            }
        ) 

        const signature  = await safeSDK.signTransactionHash(safeTxHash)
        const response = await safeService.confirmTransaction(safeTxHash,signature.data)
        console.log(`safe-transaction-zkevm.safe.global/api/v1/multisig-transactions/${safeTxHash}`)

        return response;
    }

    static executeTransaction = async (safeAddress: string, safeTxHash: string) => {
        const ethAdapter = await this.getEthAdapter();
        const safeService = new SafeServiceClient({txServiceUrl : "" , ethAdapter})

        const safeSdk  = await Safe.create({
            ethAdapter, 
            safeAddress
        })

        const safeTransaction = await safeService . getTransaction(safeTxHash)
        const executeTxResponse  = await safeSdk.executeTransaction(safeTransaction)
        const receipt = await executeTxResponse.transactionResponse?.wait()!
        console.log(`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`)
        console.log(`https://safe-tranasction-goerli.safe.global/api/v1/multisig-transaction/${safeTxHash}`)

        return receipt;
    }
} 