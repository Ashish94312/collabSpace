import React from 'react';
import { DOCUMENT_TEMPLATES } from '../constants/templates';
import './TemplateSection.css';

const TemplateSection = ({ onSelectTemplate }) => {
  return (
    <div className="template-section">
      <h3 className="template-title">Start from a template</h3>
      <div className="template-grid">
        {DOCUMENT_TEMPLATES.map(template => (
          <div 
            key={template.id} 
            className="template-card"
            onClick={() => onSelectTemplate(template.content)}>
            <h4>{template.title}</h4>
            <p>{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSection;