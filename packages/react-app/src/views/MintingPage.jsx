// @ts-nocheck
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MintingPageCard from '../components/MintingPageCard'
import { ethers } from 'ethers'
import { useContext, useState } from 'react'
import TextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
import MintingActions from 'components/MintingActions'
import Account from 'components/Account'
import { BadgeContext } from 'contexts/BadgeContext'
import { switchToOptimism } from 'helpers/SwitchToOptimism'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
const WalletAddressTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#2b2b2b',
  },
}))

export default function MintingPage({ selectedChainId, injectedProvider }) {
  const { contractRef, connectedAddress, userSigner } = useContext(BadgeContext)

  /*
   * this mint a user badge from the current selected account
   * this function throws an error
   *  - if the current network selected in the injected provider (metamask) is not optimism (chain id of optimism is 10)
   *  - if the current user doesn't have anymore a slot for minting a badge
   */
  const mintBadge = async receiverAddress => {
    let contract = new ethers.Contract(contractRef.address, contractRef.abi, injectedProvider)
    let mintTx = await contract.publicMint(receiverAddress)
    await mintTx.wait()
  }

  /*
   * this returns the number of user badge that the selected account is allowed to mint.
   * this function throws an error if the current network selected in the injected provider (metamask) is not optimism (chain id of optimism is 10)
   */
  async function allowedMinting() {
    let contract = new ethers.Contract(contractRef.address, contractRef.abi, injectedProvider)
    return await contract.allowedMinting(connectedAddress)
  }
  const [mintCount, setMintCount] = useState(0)
  const [walletAddress, setWalletAddress] = useState('')
  const [enableButton, disableButton] = useState(false)
  const theme = useTheme()
  const mobile400 = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const mobile240 = useMediaQuery(theme.breakpoints.between('xs', 'sm'))
  const mobile900 = useMediaQuery('(min-width:900px)')
  const mobileResponsiveMatch = useMediaQuery('(min-width:600px)')

  console.log({ mobileResponsiveMatch, now: new Date() })
  console.log({ mobile400, mobile240, mobile900 })
  async function doOptimismSwitch() {
    try {
      disableButton(true)
      await switchToOptimism()
    } catch (error) {
      console.log({ error })
    }
  }

  function handleChange(e) {
    setWalletAddress(e.target.value)
  }

  return (
    <>
      <Box pt="76px" mb={20}>
        <Account
          // @ts-ignore
          userSigner={userSigner}
          doOptimismSwitch={doOptimismSwitch}
          enableButton={enableButton}
          disableButton={disableButton}
        />
        <Box mb={10} sx={{ textAlign: 'left', padding: '10px', color: '#007aa6', marginLeft: 5, marginBottom: 5 }}>
          <Typography
            textAlign={'left'}
            variant={'h3'}
            fontWeight={700}
            sx={{ marginBottom: 2 }}
            color={'black'}
            fontFamily={'Noah'}
          >
            Mint a Remixer
          </Typography>
          <Typography variant="inherit" fontWeight={500} mb={3} sx={{ color: '#333333' }}>
            Remix project rewards contributors, beta testers and UX research participants with NFTs deployed on
            Optimism. <br />
            For every Remix Reward you have received, you are able to mint one additional "Remixer" badge to a different
            wallet of your choice. <br />
            See below for the number of "Remixer" badge mints you have remaining on your account. <br />
            To mint a new "Remixer" badge, input a unique wallet address below.
          </Typography>
          <Typography
            variant="inherit"
            fontWeight={500}
            mb={5}
            sx={{ color: '#333333', zIndex: 999 }}
            component={'span'}
          >
            Minting each "Remixer" badge will require a very small amount of ETH (0.15 DAI) on the Optimism network.{' '}
            <br /> If you do not have ETH on Optimism, you can transfer some from Mainnet using the{' '}
            <a href="https://app.optimism.io/bridge">Optimism Bridge</a> or{' '}
            <a href="https://app.hop.exchange/#/send?sourceNetwork=optimism&destNetwork=ethereum&token=ETH">
              Hop Exchange
            </a>
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          background: 'linear-gradient(90deg, #f6e8fc, #f1e6fb, #ede5fb, #e8e4fa, #e3e2f9, #dee1f7, #d9dff6, #d4def4)',
          height: '100vh',
        }}
      >
        <Box display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'}>
          <MintingPageCard
            top={mobile900 ? -15 : mobileResponsiveMatch ? -16 : mobile400 ? -25 : mobile240 ? -14 : -15}
          />
          <MintingActions
            mintCount={mintCount}
            setMintCount={setMintCount}
            mintBadge={mintBadge}
            allowedMinting={allowedMinting}
            walletAddress={walletAddress}
            handleChange={handleChange}
            WalletAddressTextField={WalletAddressTextField}
          />
        </Box>
      </Box>
    </>
  )
}