"use client";

import React, { useEffect,useState } from "react";
import { useTranslations } from "next-intl";
import { Check, SquareDashed } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SC_CONFIG } from "@/supacharger/supacharger-config";
import {
  evaluatePasswordStrength,
  hasDigit,
  hasLetter,
  hasLowercase,
  hasSpecial,
  hasUppercase,
} from "@/supacharger/utils/helpers";

interface ValidationItem {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

interface PasswordValidationIndicatorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  onValidationChange?: (isValid: boolean, details?: { [key: string]: boolean }) => void;
}

export default function PasswordValidationIndicator({
  value,
  onChange,
  name = "newPassword",
  id = "newPassword",
  type = "password",
  placeholder,
  onValidationChange,
}: PasswordValidationIndicatorProps) {
  const tStrengthComponent = useTranslations("evaluatePasswordStrengthComponent");

  const [showTooltip, setShowTooltip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Use central validation function for overall result
  const validationResult = evaluatePasswordStrength(value);

  // Dynamically build validation items based on config (for the checklist UI only)
  const getValidationItems = (): ValidationItem[] => {
    const minLength = SC_CONFIG.PASSWORD_MINIMUM_LENGTH;
    const requirements = SC_CONFIG.PASSWORD_REQUIREMENTS;
    const customRegex = SC_CONFIG.PASSWORD_CUSTOM_REGEX;

    if (customRegex) {
      return [
        {
          key: "custom",
          label: tStrengthComponent("passwordCustomRegexDescription"),
          test: (newPassword: string) => {
            try {
              return new RegExp(customRegex).test(newPassword);
            } catch {
              return false;
            }
          },
        },
      ];
    }

    const items: ValidationItem[] = [
      {
        key: "length",
        label: minLength + " " + tStrengthComponent("passwordMinLength"),
        test: (newPassword: string) => newPassword.length >= minLength,
      },
    ];

    switch (requirements) {
      case "letters_digits":
        items.push({
          key: "letter",
          label: tStrengthComponent("passwordLetter"),
          test: hasLetter,
        });
        items.push({
          key: "digit",
          label: tStrengthComponent("passwordDigit"),
          test: hasDigit,
        });
        break;
      case "lower_upper_letters_digits":
        items.push({
          key: "lowercase",
          label: tStrengthComponent("passwordLowercase"),
          test: hasLowercase,
        });
        items.push({
          key: "uppercase",
          label: tStrengthComponent("passwordUppercase"),
          test: hasUppercase,
        });
        items.push({
          key: "digit",
          label: tStrengthComponent("passwordDigit"),
          test: hasDigit,
        });
        break;
      case "lower_upper_letters_digits_symbols":
        items.push({
          key: "lowercase",
          label: tStrengthComponent("passwordLowercase"),
          test: hasLowercase,
        });
        items.push({
          key: "uppercase",
          label: tStrengthComponent("passwordUppercase"),
          test: hasUppercase,
        });
        items.push({
          key: "digit",
          label: tStrengthComponent("passwordDigit"),
          test: hasDigit,
        });
        items.push({
          key: "special",
          label: tStrengthComponent("passwordSymbol"),
          test: hasSpecial,
        });
        break;
      // "no_required": only length
      default:
        break;
    }

    return items;
  };

  const validationItems = getValidationItems();
  const validations = validationItems.map((item) => item.test(value));
  const allValid = validationResult.valid;
  const showCriteria = !allValid && (isFocused || value.length > 0);

  // Notify parent of validation state
  useEffect(() => {
    if (onValidationChange) {
      const details: { [key: string]: boolean } = {};
      validationItems.forEach((item, idx) => {
        details[item.key] = validations[idx];
      });
      onValidationChange(allValid, details);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, allValid, onValidationChange]);

  return (
    <div className='sc-auth-password-strength'>
      {/* Password Input */}
      <div className='sc-auth-password-control'>
        <Input
          id={id}
          name={name}
          type={type}
          autoComplete='new-password'
          value={value}
          onChange={onChange}
          maxLength={30}
          placeholder={placeholder}
          className='sc-auth-input sc-auth-password-input'
          onFocus={() => {
            setIsFocused(true);
            setShowTooltip(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setShowTooltip(false);
          }}
        />
        {allValid && value.length > 0 && (
          <span className='sc-auth-field-valid'>
            <Check className='sc-auth-field-valid-icon' size={17} strokeWidth={2.5} />
          </span>
        )}

        {/* Requirements bar (bars inside input) */}
        <div
          className='sc-auth-password-meter'
          data-visible={showCriteria ? 'true' : 'false'}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={tStrengthComponent("passwordRequirementsLabel")}
          aria-hidden={!showCriteria}
        >
          {validations.map((isValid, idx) => (
            <div
              key={validationItems[idx].key}
              className='sc-auth-password-meter-segment'
              data-valid={isValid ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && showCriteria && (
        <div className='sc-auth-password-tooltip'>
          <ul className='sc-auth-password-requirements'>
            {validationItems.map((item, idx) => (
              <li key={item.key} className='sc-auth-password-requirement'>
                <span
                  className='sc-auth-password-requirement-icon'
                  data-valid={validations[idx] ? 'true' : 'false'}
                >
                  {validations[idx] ? (
                    <Check size={15} />
                  ) : (
                    <SquareDashed size={15} />
                  )}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
