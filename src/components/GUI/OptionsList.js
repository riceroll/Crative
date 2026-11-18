import React, { useContext } from 'react'
import { CrateContext } from '../../store/CrateContext'
import OptionCard from './OptionCard'
import CollapsiblePanel from './CollapsiblePanel'

export default function OptionsList() {
  const { candidateCrates, selectedCandidateId, setSelectedCandidateId } = useContext(CrateContext)
  const { setAssemblyProgress } = useContext(CrateContext)

  return (
    <CollapsiblePanel id="tutorial-candidates-panel" title="Candidate Designs" stateKey="optionsList">
        <div className='options-container'>
          {candidateCrates.map(opt => (
            <OptionCard
              key={opt.id}
              option={opt}
              selected={opt.id === selectedCandidateId}
              onSelect={() => {
                setSelectedCandidateId(opt.id);
                setAssemblyProgress(1.0);
              }}
            />
          ))}
        </div>
    </CollapsiblePanel>
  )
}