import React, { useContext } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { CrateContext } from '../../store/CrateContext';

export default function CollapsiblePanel({ id, title, stateKey, actions, children, className = '' }) {
  const { collapsedCards, toggleCardCollapse } = useContext(CrateContext);
  const collapsed = collapsedCards[stateKey];

  return (
    <section className={`card collapsible-panel ${className}`} id={id}>
      <div className="panel-heading">
        <h2 className="panel-title">
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={!collapsed}
            aria-controls={`${id}-content`}
            onClick={() => toggleCardCollapse(stateKey)}
          >
            <span>{title}</span>
            <IoChevronDown className="panel-chevron" aria-hidden="true" />
          </button>
        </h2>
        {actions}
      </div>
      <div id={`${id}-content`} hidden={collapsed} className="panel-body">
        {children}
      </div>
    </section>
  );
}