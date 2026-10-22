import { Bot, Eye, Globe, Play, Users } from 'lucide-react'
import type { GameModule, GameSetup, PlayMode } from '../../games/types'
import { difficultyChoices, modeLabels } from './setup'

interface SetupPanelProps {
  module: GameModule
  setup: GameSetup
  onChange: (next: GameSetup) => void
  onStart: () => void
}

const modeIcons = { bot: Bot, local: Users, spectate: Eye } as const
const modes: PlayMode[] = ['bot', 'local', 'spectate']

export function SetupPanel({ module, setup, onChange, onStart }: SetupPanelProps) {
  const fields = module.setupFields.filter((field) => !field.modes || field.modes.includes(setup.mode))
  const needsDifficulty = setup.mode !== 'local'

  return (
    <section className="panel setup" aria-labelledby="setup-title">
      <div className="panel__head">
        <h2 className="panel__title" id="setup-title">
          Set up your match
        </h2>
      </div>
      <div className="panel__body setup__body">
        <fieldset className="setup__group">
          <legend className="field__label">How do you want to play?</legend>
          <div className="radio-cards setup__modes">
            {modes.map((mode) => {
              const Icon = modeIcons[mode]
              return (
                <label className="radio-card" key={mode}>
                  <input type="radio" name="mode" value={mode} checked={setup.mode === mode} onChange={() => onChange({ ...setup, mode })} />
                  <Icon size={20} aria-hidden="true" />
                  <span className="radio-card__text">
                    <strong>{modeLabels[mode].title}</strong>
                    <span>{modeLabels[mode].hint}</span>
                  </span>
                </label>
              )
            })}
            <label className="radio-card">
              <input type="radio" name="mode" value="online" disabled />
              <Globe size={20} aria-hidden="true" />
              <span className="radio-card__text">
                <strong>Play online</strong>
                <span>Not available yet. Online matches need a server.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {needsDifficulty ? (
          <fieldset className="setup__group">
            <legend className="field__label">{setup.mode === 'spectate' ? 'Bot level' : 'Bot difficulty'}</legend>
            <div className="segmented" role="group" aria-label="Bot difficulty">
              {difficultyChoices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  className="segmented__btn"
                  aria-pressed={setup.difficulty === choice.value}
                  onClick={() => onChange({ ...setup, difficulty: choice.value })}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <p className="field__hint">{difficultyChoices.find((choice) => choice.value === setup.difficulty)?.hint}.</p>
          </fieldset>
        ) : null}

        {fields.map((field) => (
          <fieldset className="setup__group" key={field.key}>
            <legend className="field__label">{field.label}</legend>
            <div className="segmented" role="group" aria-label={field.label}>
              {field.choices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  className="segmented__btn"
                  aria-pressed={(setup.options[field.key] ?? field.default) === choice.value}
                  onClick={() => onChange({ ...setup, options: { ...setup.options, [field.key]: choice.value } })}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="setup__actions">
          <button type="button" className="btn btn--primary" onClick={onStart} autoFocus>
            <Play size={16} aria-hidden="true" />
            {setup.mode === 'spectate' ? 'Start watching' : 'Start game'}
          </button>
        </div>
      </div>
    </section>
  )
}
