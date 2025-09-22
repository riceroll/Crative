import React, { useContext } from 'react'
import { CrateContext } from '../../store/CrateContext'
import OptionCard from './OptionCard'

export default function OptionsList() {
  const { candidateCrates, selectedCandidateId, setSelectedCandidateId } = useContext(CrateContext)
  
  return (
    <div
    className='card'
    >
      <div
      className='card-title'
      >Crate Designs</div>
      {candidateCrates.map(opt => (
        <OptionCard
          key={opt.id}
          option={opt}
          selected={opt.id === selectedCandidateId}
          onSelect={() => setSelectedCandidateId(opt.id)}
        />
      ))}
    </div>
  )
}