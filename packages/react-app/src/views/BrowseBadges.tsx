// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react'
import externalContracts from '../contracts/external_contracts'
import { getAllRewards } from '../helpers/getAllRewards'
import { Badge, EventBadge, RewardGroups } from '../types/rewardTypes'

import { ethers } from 'ethers'
import InputLabel from '@mui/material/InputLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ButtonGroup'
import SearchIcon from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft'
import multihash from 'multihashes'
import { CircularProgress, InputAdornment, OutlinedInput, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { Paper } from '@mui/material'
import { FormControl } from '@mui/material'
import { useContext } from 'react'
import { BadgeContext } from '../contexts/BadgeContext'
import BadgesPaginatedSection from '../components/BadgesPaginatedSection'
import { getTokenData, getEnsName } from '../helpers/getTokenData'

export const toHex = ipfsHash => {
  let buf = multihash.fromB58String(ipfsHash)
  return '0x' + multihash.toHexString(buf)
}

export const toBase58 = contentHash => {
  if (!contentHash) return ''
  let hex = contentHash.substring(2)
  let buf = multihash.fromHexString(hex)
  return multihash.toB58String(buf)
}

export const isHexadecimal = value => {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0
}

export const unwrap = async arr => {
  const resolved = []
  for (const badge of arr) {
    resolved.push(await badge)
  }
  return resolved
}

export default function BrowseBadges() {
  const [badges, setBadges] = useState([])
  const [eventBadges, setEventBadges] = useState<Array<EventBadge>>([])
  const [groupedBadges, setPagedGroupedBadges] = useState<RewardGroups>({})
  const [error, setErrorMessage] = useState('')
  const [showSpinner, setShowSpinner] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState(10)
  const { localProvider, mainnet, address, setAddress, injectedProvider, checkForWeb3Provider } =
    useContext(BadgeContext)

  let contractRef
  let providerRef
  let etherscanRef
  if (
    externalContracts[selectedChainId] &&
    externalContracts[selectedChainId].contracts &&
    externalContracts[selectedChainId].contracts.REMIX_REWARD
  ) {
    contractRef = externalContracts[selectedChainId].contracts.REMIX_REWARD
    providerRef = externalContracts[selectedChainId].provider
    etherscanRef = externalContracts[selectedChainId].etherscan
  }
  const contract = useRef(new ethers.Contract(contractRef.address, contractRef.abi, injectedProvider))

  useEffect(() => {
    const run = async () => {
      contract.current = new ethers.Contract(contractRef.address, contractRef.abi, injectedProvider)

      if (!contractRef) {
        setErrorMessage('chain not supported. ' + selectedChainId)
        return
      }
      if (!address) {
        setBadges([])
        setErrorMessage('')
        return
      }
      let resolvedAddress
      setShowSpinner(true)
      if (address.includes('.eth')) {
        resolvedAddress = await mainnet.resolveName(address)
        if (!resolvedAddress) {
          setShowSpinner(false)
          setErrorMessage(`Could not resolve this address ${address}`)
          return
        }
        setErrorMessage('')
        try {
          const balance = await contract.current.balanceOf(resolvedAddress)
          const badges = []
          for (let k = 0; k < balance; k++) {
            try {
              const tokenId = await contract.current.tokenOfOwnerByIndex(resolvedAddress, k)
              const tId = tokenId.toHexString()
              let data = await getTokenData(selectedChainId, tokenId)

              const found = eventBadges.find(x => ethers.utils.hexStripZeros(x.id) === ethers.utils.hexStripZeros(tId))
              // eslint-disable-next-line no-undef
              const badge = Object.assign({}, { transactionHash: found.transactionHash }, data, {
                decodedIpfsHash: toBase58(data[2]),
                fileName: data[3]
              })
              badges.push(badge)
            } catch (e) {
              console.error(e)
            }
          }
          if (badges.length === 0) {
            setShowSpinner(false)
            setErrorMessage('Sorry, reward for the current wallet address does not exist!')
            return
          }
          setBadges(badges)
          setShowSpinner(false)
          setErrorMessage('')
        } catch (e) {
          setShowSpinner(false)
          setErrorMessage("Please make sure your injected provider (metamask) is connected to the right network." + e.message)
        }
      } else {
        setErrorMessage('')
        try {
          const balance = await contract.current.balanceOf(address)
          const badges = []
          for (let k = 0; k < balance; k++) {
            try {
              const tokenId = await contract.current.tokenOfOwnerByIndex(address, k)
              const tId = tokenId.toHexString()
              let data = await getTokenData(selectedChainId, tokenId)

              const found = eventBadges.find(x => ethers.utils.hexStripZeros(x.id) === ethers.utils.hexStripZeros(tId))
              // eslint-disable-next-line no-undef
              const badge = Object.assign({}, { transactionHash: found.transactionHash }, data, {
                decodedIpfsHash: toBase58(data[2]),
                fileName: data[3]
              })
              badges.push(badge)
            } catch (e) {
              console.error(e)
            }
          }
          if (badges.length === 0) {
            setShowSpinner(false)
            setErrorMessage('Sorry, reward for the current wallet address does not exist!')
            return
          }
          setBadges(badges)
          setShowSpinner(false)
          setErrorMessage('')
        } catch (e) {
          setShowSpinner(false)
          setErrorMessage(e.message)
        }
      }
    }
    run()
  }, [address, contractRef, eventBadges, localProvider, mainnet, selectedChainId])

  const run = useCallback(async () => {
    setShowSpinner(true)
    if (address) {
      setEventBadges([])
      return
    }
    let rawBadges: Badge[] = await getAllRewards(contractRef.address, providerRef)
    console.log({ rawBadges })
    const badges = rawBadges.map(badge => {
      return {
        id: ethers.utils.hexStripZeros(badge.topics[3]),
        to: ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(badge.topics[2]), 20),
        transactionHash: badge.transactionHash,
      }
    })
    let dataArray = []
    const result = badges.map(async badge => {
      if (badge.id === '0x') {
        badge.id = '0x0'
      }
      let temp = { ...badge }

      let data = await getTokenData(selectedChainId, badge.id)
      temp.resolvedName = await getEnsName(temp.to)
      dataArray.push(data)
      temp.payload = data[0]
      temp.tokenType = data[1]
      temp.hash = data[2]
      temp.fileName = data[3]

      return temp
    }) // array of Promises
    let unwrapResult = []
    unwrapResult = await unwrap(result) // Unwrap Promises
    const effectResult = unwrapResult.reduce((reducedCopy, badge) => {
      let tempCopy = reducedCopy[`${badge.tokenType} ${badge.payload}`] || []
      tempCopy.push(badge)
      reducedCopy[`${badge.tokenType} ${badge.payload}`] = tempCopy
      return reducedCopy
    }, {})
    console.log({ effectResult })
    setEventBadges(badges)
    setShowSpinner(false)
    setPagedGroupedBadges(effectResult)
  }, [address, contractRef.address, mainnet, providerRef])

  useEffect(() => {
    if (address.length > 0) return
    run()
  }, [address, run])

  function checkeventBagesAndBadges(badges) {
    return badges && badges.length > 0
  }

  return (
    <>
      <Box sx={{ paddingTop: '76px' }}>
        <Box sx={{ textAlign: 'left', padding: '10px', color: '#007aa6', marginLeft: 5 }}>
          <Typography variant={'h3'} fontWeight={700} sx={{ marginBottom: 5 }} color={'#333333'} fontFamily={'Noah'}>
            Remix Rewards
          </Typography>
          <Box>
            <Typography variant="inherit" fontWeight={500} mb={3} sx={{ color: '#333333' }}>
              Remix Project rewards contributors, beta testers, and UX research participants with NFTs deployed on
              Optimism.
              <br />
              Remix Reward holders are able to mint a second “Remixer” user NFT badge to any wallet address of their
              choice.
              <br />
              This feature is a way to reward Remix contributors to help grow our user base into a larger and more
              genuine open source community of practice.
            </Typography>
            <Typography variant="inherit" fontWeight={500} sx={{ color: '#333333' }}>
              Remix Rewards are currently not transferable. This feature leaves open the future possibility of granting holders
              proportional voting power to help the community decide on new features for the IDE and/or other issues
              governing the development of the Remix toolset.
            </Typography>
          </Box>
          <Box></Box>
        </Box>
        <ToggleButtonGroup
        color="primary"
        value={'horizontal'}
        aria-label="Platform"
        selected={true}
      >
      <ToggleButton className='MuiTypography-root MuiTypography-button' value='optimism' onClick={() => {
                setBadges([])
                setShowSpinner(true)
                setSelectedChainId(10)
              }}>see on Optimism</ToggleButton>
              <ToggleButton className='MuiTypography-root MuiTypography-button' value='scroll' onClick={() => {
                setBadges([])
                setShowSpinner(true)
                setSelectedChainId(534352)
              }}>see on Scroll</ToggleButton>
      </ToggleButtonGroup>        
        <Box mt={8}>
          <Typography variant={'h6'} fontWeight={700} fontFamily={'Noah'} mb={3} sx={{ color: '#333333' }}>
            Input a wallet address to see the Remix Rewards it holds:
          </Typography>
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
            {address.length > 0 ? (
              <IconButton onClick={() => setAddress('')} sx={{ color: '#81a6f7', ':hover': { color: '#1976d2' } }}>
                {/* {'Back to Badge Gallery'} */}
                <ArrowCircleLeftIcon fontSize="large" />
              </IconButton>
            ) : null}
            <FormControl sx={{ width: '50vw' }} variant="outlined">
              <InputLabel htmlFor="addressEnsSearch">Wallet Address</InputLabel>
              <OutlinedInput
                id="addressEnsSearch"
                sx={{ color: '#444444' }}
                label="Wallet Address..."
                onChange={e => {
                  setAddress(e.target.value)
                }}
                value={address}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton>{address.length > 3 && <SearchIcon />}</IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            {badges.length === 0 && showSpinner ? (
              <CircularProgress color="secondary" sx={{ marginLeft: 5 }} />
            ) : null}
          </Box>
          {error && error.length > 0 ? (
            <Paper>
              <Typography
                sx={{
                  color: 'red',
                  fontWeight: 700,
                }}
                p={3}
              >
                {error}
              </Typography>
            </Paper>
          ) : null}
        </Box>
      </Box>
      <BadgesPaginatedSection
        badges={badges}
        checkeventBagesAndBadges={checkeventBagesAndBadges}
        etherscanRef={etherscanRef}
        eventBadges={eventBadges}
        injectedProvider={injectedProvider}
        setBadges={setBadges}
        checkForWeb3Provider={checkForWeb3Provider}
        groupedRewards={groupedBadges}
      />
    </>
  )
}
