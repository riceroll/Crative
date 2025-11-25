import React, { useContext } from 'react'
import { CrateContext } from '../../store/CrateContext'
import OptionCard from './OptionCard'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5'

export default function OptionsList() {
  const { candidateCrates, selectedCandidateId, setSelectedCandidateId } = useContext(CrateContext)
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext)
  const { collapsedCards, toggleCardCollapse } = useContext(CrateContext)
  
  const isCollapsed = collapsedCards.optionsList;

  return (
    <div className='card' id="tutorial-candidates-panel">
      <div
        className='card-title collapsible-title'
        onClick={() => toggleCardCollapse('optionsList')}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <span>Candidate Designs</span>
        <span className='collapse-icon'>
          {isCollapsed ? <IoChevronDown /> : <IoChevronUp />}
        </span>
      </div>
      
      {!isCollapsed && (
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
      )}
    </div>
  )
}