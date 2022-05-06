import React, { useState } from 'react'
import { Tabs } from '@mui/material'
import { Tab } from '@mui/material'

const menuNames = ['Browse Badges', 'Meet the Team', 'Contact Us']

export default function MenuItems() {
  const [tabValue, setTabValue] = useState()
  return (
    <>
      <Tabs
        sx={{
          marginLeft: 'auto',
        }}
        value={tabValue}
        onChange={(evt, value) => setTabValue(value)}
      >
        {menuNames && menuNames.length ? (
          menuNames.map(name => (
            <Tab
              key={name}
              label={name}
              sx={{
                fontWeight: '700',
              }}
            />
          ))
        ) : (
          <Tab
            label={'BrowseBadges'}
            sx={{
              fontWeight: '700',
            }}
          />
        )}
      </Tabs>
    </>
  )
}
