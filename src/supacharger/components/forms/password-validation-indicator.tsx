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
  onValidationChange?: (isValid: boolean, details?: { [key: string]: boolean }) => void;
}

export default function PasswordValidationIndicator({
  value,
  onChange,
  name = "newPassword",
  id = "newPassword",
  type = "password",
  onValidationChange,
}: PasswordValidationIndicatorProps) {
  const tStrengthComponent = useTranslations("evaluatePasswordStrengthComponent");
  const tAuthTerms = useTranslations("AuthTerms");

  const [showTooltip, setShowTooltip] = useState(false);

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
    <div className="space-y-2 relative">
      {/* Label */}
      <label htmlFor={id} className="text-md block px-1">
        {tAuthTerms("newPassword")}
      </label>

      {/* Password Input */}
      <div className="relative px-1">
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          maxLength={30}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        />
        {allValid && value.length > 0 && (
          <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <span className="bg-green-100 rounded-full p-1 flex items-center justify-center">
              <Check className="text-green-600" size={18} />
            </span>
          </span>
        )}
      </div>

      {/* Requirements bar (bars under input) */}
      <div
        className="flex w-full gap-2 mt-2 hover:cursor-pointer px-4"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={tStrengthComponent("passwordRequirementsLabel")}
      >
        {validations.map((isValid, idx) => (
          <div
            key={validationItems[idx].key}
            className={`
              flex-1 h-2 rounded-full transition-colors duration-300
              ${isValid ? "bg-green-500" : "bg-gray-300"}
            `}
          />
        ))}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 mt-2 w-72 p-3 bg-white rounded-md shadow-lg border border-gray-200 text-sm">
          <ul className="space-y-1">
            {validationItems.map((item, idx) => (
              <li key={item.key} className="flex items-center">
                <span
                  className={`mr-2 ${
                    validations[idx] ? "text-green-500" : "text-gray-400"
                  }`}
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
