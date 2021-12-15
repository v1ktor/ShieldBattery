import { Immutable } from 'immer'
import {
  defaultPreferenceData,
  MatchmakingPreferences,
  MatchmakingType,
} from '../../common/matchmaking'
import {
  AcceptFindMatchAsPartyRequest,
  AcceptPartyInviteRequest,
  ChangePartyLeaderRequest,
  FindMatchAsPartyRequest,
  InviteToPartyRequest,
  PartyServiceErrorCode,
  SendPartyChatMessageRequest,
} from '../../common/parties'
import { RaceChar } from '../../common/races'
import { apiUrl, urlPath } from '../../common/urls'
import { SbUserId } from '../../common/users/user-info'
import { ThunkAction } from '../dispatch-registry'
import logger from '../logging/logger'
import {
  updateLastQueuedMatchmakingType,
  updateMatchmakingPreferences,
} from '../matchmaking/action-creators'
import { push } from '../navigation/routing'
import { abortableThunk, RequestHandlingSpec } from '../network/abortable-thunk'
import { clientId } from '../network/client-id'
import { encodeBodyAsParams, fetchJson } from '../network/fetch'
import { openSnackbar, TIMING_LONG } from '../snackbars/action-creators'
import { ActivateParty, DeactivateParty } from './actions'

export function inviteToParty(targetId: SbUserId): ThunkAction {
  return dispatch => {
    const params = { clientId, targetId }
    dispatch({
      type: '@parties/inviteToPartyBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/inviteToParty',
      payload: fetchJson<void>(apiUrl`parties/invites`, {
        method: 'POST',
        body: encodeBodyAsParams<InviteToPartyRequest>({ clientId, targetId }),
      }).catch(err => {
        let message = 'An error occurred while sending an invite'
        if (err.body.code === PartyServiceErrorCode.NotificationFailure) {
          message = 'Failed to send an invite. Please try again'
        } else if (err.body.code === PartyServiceErrorCode.AlreadyMember) {
          const user = err.body.user?.name ?? 'The user'
          message = `${user} is already in your party`
        } else if (err.body.code === PartyServiceErrorCode.InvalidSelfAction) {
          message = "Can't invite yourself to the party"
        }

        dispatch(openSnackbar({ message, time: TIMING_LONG }))
        throw err
      }),
      meta: params,
    })
  }
}

export function removePartyInvite(partyId: string, targetId: SbUserId): ThunkAction {
  return dispatch => {
    const params = { partyId, targetId }
    dispatch({
      type: '@parties/removePartyInviteBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/removePartyInvite',
      payload: fetchJson<void>(apiUrl`parties/invites/${partyId}/${targetId}`, {
        method: 'DELETE',
      }).catch(err => {
        dispatch(
          openSnackbar({
            message: 'An error occurred while removing an invite',
          }),
        )
        throw err
      }),
      meta: params,
    })
  }
}

export function declinePartyInvite(partyId: string): ThunkAction {
  return dispatch => {
    const params = { partyId }
    dispatch({
      type: '@parties/declinePartyInviteBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/declinePartyInvite',
      payload: fetchJson<void>(apiUrl`parties/invites/${partyId}`, {
        method: 'DELETE',
      }).catch(err => {
        dispatch(
          openSnackbar({
            message: 'An error occurred while declining an invite',
          }),
        )
        throw err
      }),
      meta: params,
    })
  }
}

export function acceptPartyInvite(partyId: string): ThunkAction {
  return dispatch => {
    const params = { partyId, clientId }
    dispatch({
      type: '@parties/acceptPartyInviteBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/acceptPartyInvite',
      payload: fetchJson<void>(apiUrl`parties/${partyId}`, {
        method: 'POST',
        body: encodeBodyAsParams<AcceptPartyInviteRequest>({ clientId }),
      }).catch(err => {
        let message = 'An error occurred while accepting an invite'
        if (err.body.code === PartyServiceErrorCode.NotFoundOrNotInvited) {
          message = "Party doesn't exist anymore"
        } else if (err.body.code === PartyServiceErrorCode.PartyFull) {
          message = 'Party is full'
        }

        dispatch(openSnackbar({ message, time: TIMING_LONG }))
        throw err
      }),
      meta: params,
    })
  }
}

export function leaveParty(partyId: string): ThunkAction {
  return dispatch => {
    const params = { partyId, clientId }
    dispatch({
      type: '@parties/leavePartyBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/leaveParty',
      payload: fetchJson<void>(apiUrl`parties/${partyId}/${clientId}?type=leave`, {
        method: 'DELETE',
      }).catch(err => {
        dispatch(
          openSnackbar({
            message: 'An error occurred while leaving the party',
          }),
        )
        throw err
      }),
      meta: params,
    })
  }
}

export function sendChatMessage(partyId: string, message: string): ThunkAction {
  return dispatch => {
    const params = { partyId, message }
    dispatch({
      type: '@parties/sendChatMessageBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/sendChatMessage',
      payload: fetchJson<void>(apiUrl`parties/${partyId}/messages`, {
        method: 'POST',
        body: encodeBodyAsParams<SendPartyChatMessageRequest>({ message }),
      }),
      meta: params,
    })
  }
}

export function kickPlayer(partyId: string, targetId: SbUserId): ThunkAction {
  return dispatch => {
    const params = { partyId, targetId }
    dispatch({
      type: '@parties/kickFromPartyBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/kickFromParty',
      payload: fetchJson<void>(apiUrl`parties/${partyId}/${targetId}?type=kick`, {
        method: 'DELETE',
      }).catch(err => {
        dispatch(
          openSnackbar({
            message: 'An error occurred while kicking the player',
          }),
        )
        throw err
      }),
      meta: params,
    })
  }
}

export function changeLeader(partyId: string, targetId: SbUserId): ThunkAction {
  return dispatch => {
    const params = { partyId, targetId }
    dispatch({
      type: '@parties/changePartyLeaderBegin',
      payload: params,
    })

    dispatch({
      type: '@parties/changePartyLeader',
      payload: fetchJson<void>(apiUrl`parties/${partyId}/change-leader`, {
        method: 'POST',
        body: encodeBodyAsParams<ChangePartyLeaderRequest>({ targetId }),
      }).catch(err => {
        dispatch(
          openSnackbar({
            message: 'An error occurred while changing the leader',
          }),
        )
        throw err
      }),
      meta: params,
    })
  }
}

export function activateParty(partyId: string): ActivateParty {
  return {
    type: '@parties/activateParty',
    payload: { partyId },
  }
}

export function deactivateParty(partyId: string): DeactivateParty {
  return {
    type: '@parties/deactivateParty',
    payload: { partyId },
  }
}

export function findMatchAsParty(
  preferences: Immutable<MatchmakingPreferences>,
  partyId: string,
): ThunkAction {
  return dispatch => {
    const body: FindMatchAsPartyRequest = {
      preferences,
    }
    const promise = fetchJson<void>(apiUrl`parties/${partyId}/find-match`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    promise.catch(err => {
      logger.error(`Error while queuing for matchmaking as a party: ${err?.stack ?? err}`)
      dispatch(
        openSnackbar({
          message: 'An error occurred while queueing for matchmaking',
        }),
      )
    })

    dispatch(updateLastQueuedMatchmakingType(preferences.matchmakingType))
    dispatch({
      type: '@parties/findMatchAsParty',
      payload: promise,
      meta: { partyId, preferences },
    })
  }
}

export function acceptFindMatchAsParty(
  partyId: string,
  queueId: string,
  matchmakingType: MatchmakingType,
  race: RaceChar,
  spec: RequestHandlingSpec,
): ThunkAction {
  return abortableThunk(spec, async dispatch => {
    const body: AcceptFindMatchAsPartyRequest = { race }

    dispatch((_, getState) => {
      const {
        auth: {
          user: { id: selfId },
        },
        mapPools: { byType: mapPoolByType },
        matchmakingPreferences: { byType: preferencesByType },
      } = getState()

      const curPreferences = preferencesByType.get(matchmakingType)?.preferences
      if (curPreferences?.race !== race) {
        // Typings with `Immutable` tend to be... extremely annoying? For some reason I don't
        // understand. One option would just be to cast this whole object to any, but ideally we'd
        // like compilation to fail here if new things get added, so using a Record with the right
        // keys gets us *some* protection at least
        const newPreferences: Record<keyof MatchmakingPreferences, any> = {
          userId: curPreferences?.userId ?? selfId,
          matchmakingType: curPreferences?.matchmakingType ?? matchmakingType,
          race,
          mapPoolId: curPreferences?.mapPoolId ?? mapPoolByType.get(matchmakingType)?.id ?? 1,
          mapSelections: curPreferences?.mapSelections?.slice() ?? [],
          data: curPreferences?.data ?? defaultPreferenceData(matchmakingType),
        }
        dispatch(updateMatchmakingPreferences(matchmakingType, newPreferences))
      }
    })

    await fetchJson<void>(apiUrl`parties/${partyId}/find-match/${queueId}`, {
      signal: spec.signal,
      method: 'post',
      body: JSON.stringify(body),
    })
  })
}

export function cancelFindMatchAsParty(
  partyId: string,
  queueId: string,
  spec: RequestHandlingSpec,
): ThunkAction {
  return abortableThunk(spec, async () => {
    await fetchJson<void>(apiUrl`parties/${partyId}/find-match/${queueId}`, {
      signal: spec.signal,
      method: 'delete',
    })
  })
}

export function navigateToParty(partyId: string) {
  push(urlPath`/parties/${partyId}`)
}
