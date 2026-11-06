import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { LolMatch } from '@/games/lol/api/lol-types.ts';
import { ChampionIcon } from './champion-icon.tsx';
import {
  formatKda,
  formatMinutes,
  kda,
  kdaTier,
  RESULT_LABEL,
  resultOf,
} from '@/games/lol/model/match-stats.ts';
import '@/features/views/components/shared/dialog.css';
import '@/games/lol/components/shared/stat-tones.css';
import './matchup-dialog.css';

interface MatchupDialogProps {
  playerName: string;
  match: LolMatch;
  onClose: () => void;
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function MatchupDialog({ playerName, match, onClose }: Readonly<MatchupDialogProps>) {
  const result = resultOf(match);
  const { matchUp } = match;
  const matchRatio = kda(match.kills, match.deaths, match.assists);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel lol-matchup" aria-describedby={undefined}>
          <div className="dialog-header">
            <Dialog.Title className={`dialog-title lol-matchup-title--${result}`}>
              {result === 'win' ? 'Victory' : result === 'loss' ? 'Defeat' : RESULT_LABEL.remake}
              <span className="lol-matchup-duration"> · {formatMinutes(match.gameDuration)}</span>
            </Dialog.Title>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="lol-matchup-sides">
            <div className="lol-matchup-side">
              <span className="lol-matchup-name">{playerName}</span>
              <ChampionIcon
                className="lol-matchup-champion"
                championId={match.championId}
                championName={match.championName}
              />
              <span className="num">
                {match.kills} / {match.deaths} / {match.assists}
              </span>
              <span className={`lol-matchup-ratio num lol-kda--${kdaTier(matchRatio)}`}>
                {formatKda(matchRatio)}
              </span>
            </div>

            <span className="lol-matchup-vs" aria-hidden={true}>
              VS
            </span>

            {matchUp ? (
              <div className="lol-matchup-side">
                <span className="lol-matchup-name">Opponent</span>
                <ChampionIcon
                  className="lol-matchup-champion"
                  championId={matchUp.championId}
                  championName={matchUp.championName}
                />
                <span className="num">
                  {matchUp.kills} / {matchUp.deaths} / {matchUp.assists}
                </span>
                <span
                  className={`lol-matchup-ratio num lol-kda--${kdaTier(kda(matchUp.kills, matchUp.deaths, matchUp.assists))}`}
                >
                  {formatKda(kda(matchUp.kills, matchUp.deaths, matchUp.assists))}
                </span>
              </div>
            ) : (
              <p className="lol-matchup-side lol-matchup-unknown">No lane opponent recorded</p>
            )}
          </div>

          <dl className="lol-matchup-stats">
            <div>
              <dt>Wards placed</dt>
              <dd className="num">{match.wardsPlaced}</dd>
            </div>
            <div>
              <dt>Control wards</dt>
              <dd className="num">{match.visionWardsBoughtInGame}</dd>
            </div>
            <div>
              <dt>Time dead</dt>
              <dd className="num">{formatTime(match.totalTimeSpentDead)}</dd>
            </div>
          </dl>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
