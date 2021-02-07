import './App.css';
import React, { Component } from 'react';
import Web3 from 'web3';
import Navbar from './components/Navbar.js';
import Wallet from './abis/Wallet.json';
import Notification from './components/Notification.js';
import Loading from './components/Loading.js';
import ConnectionBanner from '@rimble/connection-banner';

class App extends Component {

  async componentDidMount() {
    await this.loadBlockchainData()
  }

//Loads all the blockchain data
async loadBlockchainData() {
  let web3
  
  this.setState({loading: true})
  if(typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum)
    await this.setState({web3})
    await this.loadAccountData()
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`))
    await this.setState({web3})
  }
  this.loadContractData()
  this.setState({loading: false})
}

async loadAccountData() {
  let web3 = new Web3(window.ethereum) 
  const accounts = await this.state.web3.eth.getAccounts()
  if(typeof accounts[0] !== 'undefined' && accounts[0] !== null) {
    let currentEthBalance = await this.state.web3.eth.getBalance(accounts[0])
    currentEthBalance = this.state.web3.utils.fromWei(currentEthBalance, 'Ether')
    await this.setState({account: accounts[0], currentEthBalance, isConnected: true})
  } else {
    await this.setState({account: null, isConnected: false})
  }

  console.log('Getting network')
  const networkId = await web3.eth.net.getId()
  this.setState({network: networkId})

  if(this.state.network !== 3) {
    this.setState({wrongNetwork: true})
  }
}

async loadContractData() {
  console.log('Getting contract data')
  let contractAdmin, currentWalletBalance
  let WalletData = Wallet.networks[5777]
  if(WalletData) {
    
    const abi = Wallet.abi
    const address = WalletData.address
    //Load contract and set state
    const tokenContract = new this.state.web3.eth.Contract(abi, address)
    await this.setState({ contract : tokenContract })
    console.log('Wallet contract:', this.state.contract)

    if(this.state.account ===  null || this.state.account === 'undefined') {
      currentWalletBalance = 0 
    } else {
      console.log('Getting Wallet token balance')
      currentWalletBalance = await this.state.contract.methods.balance()
      console.log('Got Wallet balance:', currentWalletBalance)
    }
    contractAdmin = await this.state.contract.methods.admin().call()
    console.log('Admin:', contractAdmin)
    this.setState({ daiBalance: currentWalletBalance, admin: contractAdmin })
  }

}

constructor(props) {
  super(props)
  this.notificationOne = React.createRef()
  this.state = {
    web3: null,
    account: null,
    admin:'0x0',
    network: null,
    wrongNetwork: false,
    loading: false,
    isConnected: null,
    contract: {},
    daiBalance: 0,
    currentEthBalance: '0',
    hash: '0x0',
    action: null,
    trxStatus: null,
    confirmNum: 0
  }
}

  render() {

    if(window.ethereum != null) {

      window.ethereum.on('chainChanged', async (chainId) => {
        window.location.reload()
      })
  
      window.ethereum.on('accountsChanged', async (accounts) => {
        if(typeof accounts[0] !== 'undefined' & accounts[0] !== null) {
          await this.loadAccountData()
        } else {
          this.setState({account: null, currentEthBalance: 0, isConnected: false})
        }
      })
  
    }

    return (
      <div className="App">
        <Navbar 
          account={this.state.account}
          balance={this.state.currentEthBalance}
          network={this.state.network}
          isConnected={this.state.isConnected}
        />
        <div className='mt-5' />
        {window.ethereum === null ?
          <ConnectionBanner className='mt-5' currentNetwork={this.state.network} requiredNetwork={3} onWeb3Fallback={true} />
          :
          this.state.wrongNetwork ? <ConnectionBanner className='mt-5' currentNetwork={this.state.network} requiredNetwork={3} onWeb3Fallback={false} /> 
          :
          null
        }
          
         {this.state.loading ?
          <Loading /> 
          :
          <>
          <Notification 
            showNotification={this.state.showNotification}
            action={this.state.action}
            hash={this.state.hash}
            ref={this.notificationOne}
            trxStatus={this.state.trxStatus}
            confirmNum={this.state.confirmNum}
          />
          <div className='row mt-1'></div>
          <h1 className='mt-2' id='title'>Yearn Wallet</h1>
          <h1>Admin: {this.state.admin}</h1>
        </>
        }
      </div>
    );
  }
}

export default App;
