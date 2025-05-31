// Evaluation question configuration for both landing page and in-app flows

export interface EvaluationQuestion {
  key: string;
  type: 'boolean' | 'number' | 'text' | 'select' | 'date' | 'object';
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf?: Record<string, any>;
    hideIf?: Record<string, any>;
  };
}

export interface EvaluationSection {
  id: string;
  title: string;
  description?: string;
  questions: EvaluationQuestion[];
}

// Landing page eligibility check - 6 simple questions
export const landingPageQuestions: EvaluationQuestion[] = [
  {
    key: 'has_person_died',
    type: 'boolean',
    title: 'Has someone passed away?',
    description: 'We can only help with probate applications for deceased persons.',
    required: true
  },
  {
    key: 'death_in_england_wales',
    type: 'boolean',
    title: 'Did the person die in England or Wales?',
    description: 'Our service covers probate applications in England and Wales only.',
    required: true,
    conditionalLogic: {
      showIf: { has_person_died: true }
    }
  },
  {
    key: 'has_will',
    type: 'boolean',
    title: 'Did the person leave a will?',
    description: 'This affects the type of probate application needed.',
    required: true,
    conditionalLogic: {
      showIf: { death_in_england_wales: true }
    }
  },
  {
    key: 'estate_value_estimate',
    type: 'select',
    title: 'What is the estimated value of the estate?',
    description: 'Include property, savings, investments, and personal belongings.',
    required: true,
    options: [
      'Under £5,000',
      '£5,000 - £325,000',
      'Over £325,000'
    ],
    conditionalLogic: {
      showIf: { has_will: [true, false] }
    }
  },
  {
    key: 'applicant_named_executor',
    type: 'boolean',
    title: 'Are you named as an executor in the will?',
    description: 'Only executors can apply for probate when there is a will.',
    required: true,
    conditionalLogic: {
      showIf: { has_will: true }
    }
  },
  {
    key: 'next_of_kin',
    type: 'boolean',
    title: 'Are you the spouse, civil partner, child, or parent of the deceased?',
    description: 'Priority order applies for administration applications.',
    required: true,
    conditionalLogic: {
      showIf: { has_will: false }
    }
  }
];

// Detailed in-app evaluation flow - Two-phase approach with IHT calculations first
export const detailedEvaluationSections: EvaluationSection[] = [
  {
    id: 'phase_1_iht_eligibility',
    title: 'Phase 1: Estate & IHT Eligibility',
    description: 'Essential estate information needed to determine IHT requirements and thresholds before proceeding',
    questions: [
      {
        key: 'deceased_domiciled_uk',
        type: 'boolean',
        title: 'Was the deceased domiciled in the UK at death?',
        description: 'Required for "excepted estate" status determination',
        required: true
      },
      {
        key: 'gifts_last_7_years',
        type: 'boolean',
        title: 'Did the deceased make any gifts in the 7 years before death?',
        description: 'Gifts could reduce the nil rate band and may trigger IHT400 requirements',
        required: true
      },
      {
        key: 'married_civil_partnership',
        type: 'boolean',
        title: 'Was the deceased married or in a civil partnership at death?',
        description: 'Needed for spousal exemption and transferable nil rate band calculations',
        required: true
      },
      {
        key: 'spouse_partner_deceased',
        type: 'boolean',
        title: 'Had their spouse/partner already died?',
        description: 'Required to determine if transferable nil rate band (TNRB) is available',
        required: true,
        conditionalLogic: {
          showIf: { married_civil_partnership: true }
        }
      },
      {
        key: 'spouse_nrb_fully_used',
        type: 'boolean',
        title: 'Was the spouse\'s nil rate band fully used?',
        description: 'Needed to calculate available transferable nil rate band',
        required: true,
        conditionalLogic: {
          showIf: { spouse_partner_deceased: true }
        }
      },
      {
        key: 'home_to_children_grandchildren',
        type: 'boolean',
        title: 'Did the deceased leave their home to children or grandchildren?',
        description: 'This triggers the Residence Nil Rate Band (RNRB) which increases the IHT threshold',
        required: true
      },
      {
        key: 'deceased_lived_uk_property',
        type: 'boolean',
        title: 'Did the deceased live in a UK property they owned?',
        description: 'Required for Residence Nil Rate Band eligibility check',
        required: true,
        conditionalLogic: {
          showIf: { home_to_children_grandchildren: true }
        }
      },
      {
        key: 'trust_involvement',
        type: 'boolean',
        title: 'Did the deceased benefit from a trust or create any trusts?',
        description: 'Trust involvement triggers IHT400 Schedule 418 requirements',
        required: true
      },
      {
        key: 'overseas_assets',
        type: 'boolean',
        title: 'Were any assets held overseas by the deceased?',
        description: 'Foreign assets trigger IHT400 Schedule 417 and additional reporting requirements',
        required: true
      }
    ]
  },
  {
    id: 'applicant',
    title: 'Applicant Details',
    description: 'Information about who is applying for probate',
    questions: [
      {
        key: 'q1_executor_named',
        type: 'boolean',
        title: 'Are you named as an executor in the will?',
        required: true
      },
      {
        key: 'q2_poas',
        type: 'boolean',
        title: 'Are you acting under a power of attorney on behalf of an executor?',
        description: 'If No, user is ineligible',
        required: false,
        conditionalLogic: {
          showIf: { q1_executor_named: false }
        }
      },
      {
        key: 'q3_applicant_count',
        type: 'number',
        title: 'How many people are applying?',
        description: 'Maximum 4 applicants allowed. Flag if 2+ required based on Q4',
        required: true,
        validation: {
          min: 1,
          max: 4
        }
      },
      {
        key: 'q4_under18_gift',
        type: 'boolean',
        title: 'Is anyone under 18 receiving a gift in the will or codicil?',
        description: 'If Yes, at least 2 applicants are mandatory',
        required: true
      }
    ]
  },
  {
    id: 'deceased',
    title: "Deceased's Information",
    description: 'Details about the person who has died',
    questions: [
      {
        key: 'q5_domicile_uk',
        type: 'boolean',
        title: 'Did the deceased live permanently in England or Wales?',
        description: 'If No, flag potential IHT401 need',
        required: true
      },
      {
        key: 'q6_alt_names',
        type: 'boolean',
        title: 'Did the deceased hold any assets under another name?',
        description: 'If Yes, list must appear on the grant',
        required: true
      },
      {
        key: 'q7_foreign_assets',
        type: 'boolean',
        title: 'Did the deceased own foreign (non-UK) assets?',
        description: 'If Yes, may trigger IHT400 requirement',
        required: true
      },
      {
        key: 'q8_settled_land',
        type: 'boolean',
        title: 'Was any land still held as settled land?',
        description: 'If Yes, flag for legal review',
        required: true
      },
      {
        key: 'q9_adoptions',
        type: 'boolean',
        title: 'Were any relatives adopted in/out of the family?',
        description: 'If Yes, may affect inheritance relationships',
        required: true
      }
    ]
  },
  {
    id: 'will',
    title: 'Will and Executors',
    description: 'Information about the will and other executors',
    questions: [
      {
        key: 'q10_will_date',
        type: 'date',
        title: 'What is the date of the will?',
        description: 'Mandatory for PA1P',
        required: true
      },
      {
        key: 'q11_codicils',
        type: 'boolean',
        title: 'Are there codicils to the will?',
        description: 'If Yes, originals must be submitted',
        required: true
      },
      {
        key: 'q12_will_revoked',
        type: 'boolean',
        title: 'Did the deceased marry after making the will?',
        description: 'If Yes, will may be invalid – show warning',
        required: true
      },
      {
        key: 'q13_foreign_wills',
        type: 'boolean',
        title: 'Any wills made outside England and Wales?',
        description: 'If Yes, translations may be required',
        required: true
      },
      {
        key: 'q14_all_executors_applying',
        type: 'boolean',
        title: 'Are all named executors applying?',
        description: 'If No, ask Q15',
        required: true
      },
      {
        key: 'q15_non_applying_reasons',
        type: 'select',
        title: 'Why is each non-applying executor not applying?',
        description: 'Required to determine Section 5, PA11, renunciation, etc.',
        required: false,
        options: ['renunciation', 'deceased', 'cannot_locate', 'lacks_capacity', 'power_reserved'],
        conditionalLogic: {
          showIf: { q14_all_executors_applying: false }
        }
      }
    ]
  },
  {
    id: 'iht',
    title: 'Inheritance Tax Readiness',
    description: 'IHT form completion status',
    questions: [
      {
        key: 'q16_iht_done',
        type: 'boolean',
        title: 'Has an Inheritance Tax (IHT) form been completed?',
        description: 'If No, block PA1P until completed',
        required: true
      },
      {
        key: 'q17_iht_form_type',
        type: 'select',
        title: 'Which form was completed?',
        description: 'Pre-condition for submitting PA1P',
        required: false,
        options: ['IHT205', 'IHT400'],
        conditionalLogic: {
          showIf: { q16_iht_done: true }
        }
      }
    ]
  }
];

// Logic engine for deriving flags from answers
export function deriveEvaluationFlags(answers: Record<string, any>): Record<string, any> {
  const flags: Record<string, any> = {};
  
  // Eligibility checks
  flags.eligible_to_apply = true;
  flags.needs_probate = true;
  flags.probate_type = 'grant_of_probate';
  
  // Check basic eligibility
  if (answers.q1_executor_named === false && answers.q2_power_of_attorney === false) {
    flags.eligible_to_apply = false;
    flags.error_reason = 'Not named as executor and no power of attorney';
  }
  
  // Determine probate type
  if (!answers.has_will || answers.has_will === false) {
    flags.probate_type = 'letters_of_administration';
  }
  
  // Document requirements
  flags.needs_renunciation_form = false;
  flags.needs_pa13 = false;
  flags.needs_translation = false;
  
  if (answers.q15_all_executors_applying === false) {
    const reasons = answers.q16_non_applying_reasons || [];
    if (reasons.includes('Renouncing')) {
      flags.needs_renunciation_form = true;
    }
  }
  
  if (answers.q13_will_revoked === true) {
    flags.needs_pa13 = true;
  }
  
  if (answers.q14_foreign_wills === true) {
    flags.needs_translation = true;
  }
  
  // IHT form determination
  flags.iht_form_required = 'IHT205';
  
  const grossValue = answers.q17_gross_value || 0;
  const hasForeignAssets = answers.q7_foreign_assets === true;
  
  if (grossValue > 325000 || hasForeignAssets) {
    flags.iht_form_required = 'IHT400';
  }
  
  // Estate status - if IHT400 required or gross value > £5000, estate needs detailed asset/liability tracking
  flags.estateNotExcepted = flags.iht_form_required === 'IHT400' || grossValue > 5000;
  
  // PA1P sections required
  flags.pa1p_sections = {
    section_a: true, // Always required
    section_b: true, // Always required
    section_c: true, // Always required
    section_d: answers.q4_under18_gift === true,
    section_e: answers.q15_all_executors_applying === false,
    section_f: answers.q7_alt_names === true,
    section_g: answers.q10_adoptions === true
  };
  
  // Validation flags
  flags.application_ready = true;
  flags.missing_requirements = [];
  
  if (answers.q19_iht_done !== true) {
    flags.application_ready = false;
    flags.missing_requirements.push('IHT form must be completed first');
  }
  
  if (answers.q3_applicant_count > 4) {
    flags.application_ready = false;
    flags.missing_requirements.push('Maximum 4 applicants allowed');
  }
  
  if (answers.q4_under18_gift === true && (answers.q3_applicant_count || 1) < 2) {
    flags.application_ready = false;
    flags.missing_requirements.push('At least 2 applicants required when under-18s receive gifts');
  }
  
  return flags;
}

// Landing page eligibility logic
export function deriveLandingPageResult(answers: Record<string, any>): {
  eligible: boolean;
  probateRequired: boolean;
  nextSteps: string[];
  warnings: string[];
} {
  const result = {
    eligible: true,
    probateRequired: true,
    nextSteps: [] as string[],
    warnings: [] as string[]
  };
  
  // Basic eligibility checks
  if (!answers.has_person_died) {
    result.eligible = false;
    result.probateRequired = false;
    result.nextSteps.push('Probate can only be applied for after someone has died.');
    return result;
  }
  
  if (!answers.death_in_england_wales) {
    result.eligible = false;
    result.nextSteps.push('For deaths outside England and Wales, contact the relevant jurisdiction.');
    return result;
  }
  
  // Estate value checks
  if (answers.estate_value_estimate === 'Under £5,000') {
    result.probateRequired = false;
    result.nextSteps.push('Probate may not be required for estates under £5,000.');
    result.nextSteps.push('Check with individual institutions about their requirements.');
    return result;
  }
  
  // Applicant eligibility
  if (answers.has_will && !answers.applicant_named_executor) {
    result.eligible = false;
    result.nextSteps.push('Only named executors can apply when there is a will.');
    result.warnings.push('You may need to contact the named executors.');
    return result;
  }
  
  if (!answers.has_will && !answers.next_of_kin) {
    result.eligible = false;
    result.nextSteps.push('Priority rules apply - spouse, children, or parents typically apply first.');
    result.warnings.push('Other relatives may be able to apply if closer relatives renounce.');
    return result;
  }
  
  // Success case
  result.nextSteps.push('You appear eligible to apply for probate.');
  result.nextSteps.push('Continue to ProbateSwift to complete your detailed application.');
  
  if (answers.estate_value_estimate === 'Over £325,000') {
    result.warnings.push('Inheritance tax may be due on estates over £325,000.');
  }
  
  return result;
}