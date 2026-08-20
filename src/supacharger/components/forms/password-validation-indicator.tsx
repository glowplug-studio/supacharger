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
    <div className="space-y-2 relative">
      {/* Password Input */}
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={type}
          autoComplete='new-password'
          value={value}
          onChange={onChange}
          maxLength={30}
          placeholder={placeholder}
          className="sc-auth-input pr-16"
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
          <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 flex -translate-y-1/2 items-center">
            <Check className="text-green-500" size={17} strokeWidth={2.5} />
          </span>
        )}

        {/* Requirements bar (bars inside input) */}
        <div
          className={`absolute inset-x-5 bottom-2 flex gap-2 transition-opacity duration-200 ${
            showCriteria ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={tStrengthComponent("passwordRequirementsLabel")}
          aria-hidden={!showCriteria}
        >
          {validations.map((isValid, idx) => (
            <div
              key={validationItems[idx].key}
              className={`
                h-1 flex-1 rounded-full transition-colors duration-300
                ${isValid ? "bg-green-500" : "bg-gray-300"}
              `}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && showCriteria && (
        <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-lg dark:border-white/10 dark:bg-[#1a1919] dark:text-white">
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
