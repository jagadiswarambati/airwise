import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Field } from '../../src/ui/primitives/Field';
import { Fieldset } from '../../src/ui/primitives/Fieldset';
import { ErrorSummary } from '../../src/ui/primitives/ErrorSummary';
import { Stepper } from '../../src/ui/primitives/Stepper';
import { ChoiceGroup } from '../../src/ui/primitives/ChoiceGroup';

describe('Accessible Form Primitives', () => {
  describe('Field', () => {
    it('renders label with matching htmlFor and child input id', () => {
      const html = renderToString(
        <Field id="test-name" label="Full Name">
          <input type="text" />
        </Field>,
      );

      expect(html).toContain('for="test-name"');
      expect(html).toContain('id="test-name"');
      expect(html).toContain('Full Name');
    });

    it('renders required indicator when required is true', () => {
      const html = renderToString(
        <Field id="test-req" label="Required Field" required>
          <input type="text" />
        </Field>,
      );

      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('*');
    });

    it('links helper text via aria-describedby', () => {
      const html = renderToString(
        <Field id="test-helper" label="Email" helperText="We will never share your email">
          <input type="email" />
        </Field>,
      );

      expect(html).toContain('id="test-helper-helper"');
      expect(html).toContain('aria-describedby="test-helper-helper"');
      expect(html).toContain('We will never share your email');
    });

    it('renders error message and applies aria-invalid to child control', () => {
      const html = renderToString(
        <Field id="test-err" label="Username" error="Username is already taken">
          <input type="text" />
        </Field>,
      );

      expect(html).toContain('id="test-err-error"');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('aria-describedby="test-err-error"');
      expect(html).toContain('Username is already taken');
      expect(html).toContain('aw-field-has-error');
    });

    it('combines helper text and error in aria-describedby', () => {
      const html = renderToString(
        <Field
          id="test-combo"
          label="Password"
          helperText="At least 8 characters"
          error="Password too short"
        >
          <input type="password" />
        </Field>,
      );

      expect(html).toContain('aria-describedby="test-combo-helper test-combo-error"');
      expect(html).toContain('At least 8 characters');
      expect(html).toContain('Password too short');
    });
  });

  describe('Fieldset', () => {
    it('renders semantic fieldset with legend', () => {
      const html = renderToString(
        <Fieldset legend="Contact Preferences">
          <p>Options</p>
        </Fieldset>,
      );

      expect(html).toContain('<fieldset');
      expect(html).toContain('<legend class="aw-legend">Contact Preferences</legend>');
      expect(html).toContain('Options');
    });

    it('links helper and error to fieldset aria-describedby when id is provided', () => {
      const html = renderToString(
        <Fieldset
          id="pref-group"
          legend="Notification Channel"
          helperText="Choose at least one"
          error="Selection required"
        >
          <p>Choices</p>
        </Fieldset>,
      );

      expect(html).toContain('id="pref-group"');
      expect(html).toContain('aria-describedby="pref-group-helper pref-group-error"');
      expect(html).toContain('id="pref-group-helper"');
      expect(html).toContain('id="pref-group-error"');
      expect(html).toContain('Selection required');
      expect(html).toContain('aw-fieldset-has-error');
    });
  });

  describe('ErrorSummary', () => {
    it('renders nothing when errors list is empty', () => {
      const html = renderToString(<ErrorSummary errors={[]} />);
      expect(html).toBe('');
    });

    it('renders role="alert", tabIndex={-1}, and links to invalid fields', () => {
      const errors = [
        { fieldId: 'field-1', message: 'First field is required' },
        { fieldId: 'field-2', message: 'Second field is invalid' },
      ];

      const html = renderToString(<ErrorSummary errors={errors} />);

      expect(html).toContain('role="alert"');
      expect(html).toContain('tabindex="-1"');
      expect(html).toContain('There are 2 problems with your information');
      expect(html).toContain('href="#field-1"');
      expect(html).toContain('First field is required');
      expect(html).toContain('href="#field-2"');
      expect(html).toContain('Second field is invalid');
    });

    it('renders custom title or singular title for 1 error', () => {
      const html = renderToString(
        <ErrorSummary errors={[{ fieldId: 'email', message: 'Enter a valid email' }]} />,
      );

      expect(html).toContain('There is 1 problem with your information');
      expect(html).toContain('href="#email"');
    });
  });

  describe('Stepper', () => {
    it('renders step indicator and progress bar with custom property', () => {
      const html = renderToString(
        <Stepper currentStep={2} totalSteps={5} stepTitle="Who lives here" />,
      );

      expect(html).toContain('role="group"');
      expect(html).toContain('aria-label="Step 2 of 5: Who lives here"');
      expect(html).toContain('Step 2 of 5: Who lives here');
      expect(html).toContain('40%');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('--stepper-progress:40%');
    });
  });

  describe('ChoiceGroup', () => {
    it('renders radio inputs with labels and values', () => {
      const options = [
        { value: 'opt1', label: 'Option 1', description: 'Desc 1' },
        { value: 'opt2', label: 'Option 2' },
      ];

      const html = renderToString(
        <ChoiceGroup
          name="testRadio"
          type="radio"
          options={options}
          value="opt1"
          onChange={() => {}}
        />,
      );

      expect(html).toContain('type="radio"');
      expect(html).toContain('name="testRadio"');
      expect(html).toContain('id="testRadio-opt1"');
      expect(html).toContain('for="testRadio-opt1"');
      expect(html).toContain('Option 1');
      expect(html).toContain('Desc 1');
      expect(html).toContain('checked=""');
    });

    it('renders checkbox inputs with multiple checked items', () => {
      const options = [
        { value: 'c1', label: 'Check 1' },
        { value: 'c2', label: 'Check 2' },
      ];

      const html = renderToString(
        <ChoiceGroup
          name="testCheckbox"
          type="checkbox"
          options={options}
          value={['c1', 'c2']}
          onChange={() => {}}
        />,
      );

      expect(html).toContain('type="checkbox"');
      expect(html).toContain('id="testCheckbox-c1"');
      expect(html).toContain('id="testCheckbox-c2"');
    });
  });
});
