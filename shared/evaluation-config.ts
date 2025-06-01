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

// Detailed in-app evaluation flow - Five sections following the revised scope
export const detailedEvaluationSections: EvaluationSection[] = [
  {
    id: 'deceased_details',
    title: 'Section 1: About the Deceased',
    description: 'Basic information about the person who has passed away',
    questions: [
      {
        key: 'deceased_domiciled_uk',
        type: 'boolean',
        title: 'Was the deceased domiciled in the UK at death?',
        description: '"Domicile" means the country the person considered their permanent home, even if they died elsewhere.',
        required: true
      },
      {
        key: 'deceased_lived_england_wales',
        type: 'boolean',
        title: 'Did the deceased live permanently in England or Wales?',
        description: 'Did they live most of their life and plan to stay in England or Wales?',
        required: true
      },
      {
        key: 'deceased_foreign_assets',
        type: 'boolean',
        title: 'Did the deceased own non-UK (foreign) assets?',
        description: 'Did they own property, money, or investments outside the UK?',
        required: true
      },
      {
        key: 'deceased_settled_land',
        type: 'boolean',
        title: 'Did the deceased own land held as settled land?',
        description: 'Settled land is a legal term for certain types of land trusts (rare—leave blank if unsure).',
        required: true
      },
      {
        key: 'deceased_other_names',
        type: 'boolean',
        title: 'Did the deceased hold assets under another name?',
        description: 'Did the person have any bank accounts, property, or investments in any other names (including maiden names, aliases, or nicknames)?',
        required: true
      },
      {
        key: 'family_adoptions',
        type: 'boolean',
        title: 'Were any relatives adopted in/out of the family?',
        description: 'Was anyone adopted into or out of the deceased\'s family (could affect inheritance rules)?',
        required: true
      }
    ]
  },
  {
    id: 'tax_estate_threshold',
    title: 'Section 2: Tax & Estate Threshold',
    description: 'Information needed to determine inheritance tax requirements',
    questions: [
      {
        key: 'gifts_last_7_years',
        type: 'boolean',
        title: 'Did the deceased make gifts in the 7 years before death?',
        description: 'Did they give away money, property, or valuable items in the last 7 years of life?',
        required: true
      },
      {
        key: 'married_civil_partnership',
        type: 'boolean',
        title: 'Was the deceased married or in a civil partnership at death?',
        description: 'Were they married or in a civil partnership when they died?',
        required: true
      },
      {
        key: 'spouse_partner_deceased',
        type: 'boolean',
        title: 'Had their spouse/civil partner already died?',
        description: 'Had their spouse or partner died before them?',
        required: true,
        conditionalLogic: {
          showIf: { married_civil_partnership: true }
        }
      },
      {
        key: 'spouse_nrb_fully_used',
        type: 'boolean',
        title: 'Was the spouse\'s nil rate band fully used?',
        description: 'Did the spouse/partner use all their inheritance tax allowance, or is some available to transfer? (If unsure, select "Not sure.")',
        required: true,
        conditionalLogic: {
          showIf: { spouse_partner_deceased: true }
        }
      },
      {
        key: 'home_to_children_grandchildren',
        type: 'boolean',
        title: 'Did the deceased leave their home to children or grandchildren?',
        description: 'Was the family home left to children or grandchildren?',
        required: true
      },
      {
        key: 'deceased_lived_uk_property',
        type: 'boolean',
        title: 'Did the deceased live in a UK property they owned?',
        description: 'Did they live in a house or flat in the UK that they owned?',
        required: true
      },
      {
        key: 'trust_involvement',
        type: 'boolean',
        title: 'Did the deceased create or benefit from a trust?',
        description: 'Did they put assets into a trust or benefit from a trust at any point? (If unsure, select "No.")',
        required: true
      }
    ]
  },
  {
    id: 'will_executors',
    title: 'Section 3: Will & Executors',
    description: 'Information about the will and executors (shown only if there is a will)',
    questions: [
      {
        key: 'will_date',
        type: 'date',
        title: 'What is the date of the will?',
        description: 'Enter the date shown on the will.',
        required: true
      },
      {
        key: 'married_after_will',
        type: 'boolean',
        title: 'Did the deceased marry after making the will?',
        description: 'Did the deceased get married or register a civil partnership after their last will was made? (This may affect validity.)',
        required: true
      },
      {
        key: 'will_codicils',
        type: 'boolean',
        title: 'Are there codicils to the will?',
        description: 'Are there any official changes or addendums (codicils) attached to the will?',
        required: true
      },
      {
        key: 'foreign_wills',
        type: 'boolean',
        title: 'Were any wills made outside England and Wales?',
        description: 'Did the deceased make any wills in another country? (Copies may be needed.)',
        required: true
      },
      {
        key: 'all_executors_applying',
        type: 'boolean',
        title: 'Are all named executors applying?',
        description: 'Are all the executors listed in the will actually applying for probate?',
        required: true
      },
      {
        key: 'non_applying_executor_reasons',
        type: 'select',
        title: 'Why is each non-applying executor not applying?',
        description: 'Please state the reason for each executor not applying (choose from the list).',
        required: false,
        options: ['renunciation', 'deceased', 'cannot locate', 'lacks capacity', 'power reserved'],
        conditionalLogic: {
          showIf: { all_executors_applying: false }
        }
      }
    ]
  },
  {
    id: 'about_applicant',
    title: 'Section 4: About You (Applicant)',
    description: 'Information about the person applying for probate',
    questions: [
      {
        key: 'named_executor_in_will',
        type: 'boolean',
        title: 'Are you named as an executor in the will?',
        description: 'Are you personally named as an executor in the will?',
        required: true
      },
      {
        key: 'acting_under_poa',
        type: 'boolean',
        title: 'Are you acting under a power of attorney on behalf of an executor?',
        description: 'Are you applying as a legally appointed representative for a named executor?',
        required: true,
        conditionalLogic: {
          showIf: { named_executor_in_will: false }
        }
      },
      {
        key: 'number_of_applicants',
        type: 'number',
        title: 'How many people are applying?',
        description: 'How many people will be named as applicants on this probate application?',
        required: true,
        validation: {
          min: 1,
          max: 4
        }
      },
      {
        key: 'under18_beneficiaries',
        type: 'boolean',
        title: 'Is anyone under 18 receiving a gift in the will?',
        description: 'Will any beneficiaries under 18 receive money or property from the estate? (If yes, at least two applicants must apply.)',
        required: true
      }
    ]
  },
  {
    id: 'iht_readiness',
    title: 'Section 5: Inheritance Tax Readiness',
    description: 'Inheritance tax form completion status',
    questions: [
      {
        key: 'estate_excepted_from_iht',
        type: 'boolean',
        title: 'Is the estate excepted from Inheritance Tax?',
        description: 'Is the total estate below the inheritance tax threshold or otherwise exempt? (Most simple estates are excepted.)',
        required: true
      },
      {
        key: 'iht400_completed',
        type: 'boolean',
        title: 'If not excepted, has an IHT400 been completed and submitted?',
        description: 'If the estate isn\'t excepted, has the Inheritance Tax form (IHT400) already been completed and sent to HMRC?',
        required: true,
        conditionalLogic: {
          showIf: { estate_excepted_from_iht: false }
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