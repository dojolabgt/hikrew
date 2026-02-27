import React from 'react';

/**
 * Common React event types for reuse across components
 */

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;
export type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;
export type DivClickEvent = React.MouseEvent<HTMLDivElement>;
export type LinkClickEvent = React.MouseEvent<HTMLAnchorElement>;
