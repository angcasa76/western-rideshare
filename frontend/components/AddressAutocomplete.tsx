"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";


type Suggestion = {
  address: string;
  lat: number;
  lon: number;
};


type AddressAutocompleteProps = {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  required?: boolean;
};


export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Start typing an address",
  required = false,
}: AddressAutocompleteProps) {

  const [
    suggestions,
    setSuggestions,
  ] =
    useState<Suggestion[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);


  const [
    selectedValue,
    setSelectedValue,
  ] =
    useState("");


  const wrapperRef =
    useRef<HTMLDivElement>(
      null
    );


  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {

        setIsOpen(false);

      }

    }


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  useEffect(() => {

    const query =
      value.trim();


    if (
      query.length < 2
    ) {

      setSuggestions([]);

      setIsOpen(false);

      return;

    }


    if (
      value === selectedValue
    ) {

      setSuggestions([]);

      setIsOpen(false);

      return;

    }


    const controller =
      new AbortController();


    const timer =
      setTimeout(
        async () => {

          setLoading(true);


          try {

            const response =
              await fetch(
                `/api/addresssearch?q=${encodeURIComponent(
                  query
                )}`,
                {
                  signal:
                    controller.signal,

                  cache:
                    "no-store",
                }
              );


            if (
              !response.ok
            ) {

              setSuggestions([]);

              setIsOpen(false);

              return;

            }


            const data =
              await response.json();


            const results:
              Suggestion[] =
              Array.isArray(
                data.suggestions
              )
                ? data.suggestions
                : [];


            setSuggestions(
              results
            );


            if (
              results.length > 0
            ) {

              setIsOpen(true);

            } else {

              setIsOpen(false);

            }

          } catch (error) {

            if (
              error instanceof Error &&
              error.name ===
                "AbortError"
            ) {

              return;

            }


            console.error(
              "Address autocomplete error:",
              error
            );


            setSuggestions([]);

            setIsOpen(false);

          } finally {

            setLoading(false);

          }

        },
        350
      );


    return () => {

      clearTimeout(timer);

      controller.abort();

    };

  }, [
    value,
    selectedValue,
  ]);


  function selectSuggestion(
    suggestion: Suggestion
  ) {

    setSelectedValue(
      suggestion.address
    );


    onChange(
      suggestion.address
    );


    setSuggestions([]);

    setIsOpen(false);

  }


  return (
    <div
      ref={wrapperRef}
      className="relative z-50"
    >

      <label className="block text-sm font-semibold text-gray-900">
        {label}
      </label>


      <div className="relative mt-2">

        <input
          type="text"
          value={value}
          required={required}
          autoComplete="off"
          spellCheck={false}
          placeholder={
            placeholder
          }

          onChange={(
            event
          ) => {

            setSelectedValue(
              ""
            );

            onChange(
              event.target.value
            );

          }}

          onFocus={() => {

            if (
              suggestions.length >
              0
            ) {

              setIsOpen(true);

            }

          }}

          className="
            w-full
            rounded-xl
            border
            border-gray-300
            bg-white
            px-4
            py-3
            pr-12
            text-gray-900
            outline-none
            transition
            focus:border-[#4f2683]
            focus:ring-2
            focus:ring-purple-100
          "
        />


        {loading && (

          <div className="absolute right-4 top-1/2 -translate-y-1/2">

            <div
              className="
                h-5
                w-5
                animate-spin
                rounded-full
                border-2
                border-gray-300
                border-t-[#4f2683]
              "
            />

          </div>

        )}

      </div>


      {isOpen &&
        suggestions.length >
          0 && (

        <div
          className="
            absolute
            left-0
            right-0
            top-full
            z-[99999]
            mt-2
            max-h-80
            overflow-y-auto
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-2xl
          "
        >

          {suggestions.map(
            (
              suggestion,
              index
            ) => (

              <button
                key={
                  `${suggestion.address}-${index}`
                }
                type="button"

                onMouseDown={(
                  event
                ) => {

                  event.preventDefault();

                  selectSuggestion(
                    suggestion
                  );

                }}

                className="
                  flex
                  w-full
                  items-start
                  gap-3
                  border-b
                  border-gray-100
                  bg-white
                  px-4
                  py-4
                  text-left
                  transition
                  last:border-b-0
                  hover:bg-[#f7f2fb]
                "
              >

                <div
                  className="
                    mt-0.5
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#f1ebf7]
                    text-[#4f2683]
                  "
                >
                  ●
                </div>


                <div className="min-w-0">

                  <p className="text-sm font-semibold leading-5 text-gray-900">
                    {
                      suggestion.address
                    }
                  </p>


                  <p className="mt-1 text-xs text-gray-500">
                    Tap to use this address
                  </p>

                </div>

              </button>

            )
          )}

        </div>

      )}


      <p className="mt-2 text-xs text-gray-500">
        Start typing and choose an address from the dropdown.
      </p>

    </div>
  );
}