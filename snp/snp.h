#pragma once

#include "common/types.h"
#include "snp/functions.h"

namespace sbat {
namespace snp {
struct SnpCapabilities {
  uint32 size;
  uint32 unknown1;
  uint32 max_packet_size;
  uint32 unknown3;
  uint32 displayed_player_count;
  uint32 unknown4;
  uint32 player_latency;
  uint32 max_player_count;
  uint32 turn_delay;
};

struct SNetSnpListEntry {
  SNetSnpListEntry* prev;
  SNetSnpListEntry* next;
  char file_path[260];
  uint32 index;
  uint32 identifier;
  char name[128];
  char description[128];
  SnpCapabilities capabilities;
};

struct SnpFunctions {
  uint32 size;

  void* func1;
  UnbindFunc Unbind;
  FreePacketFunc FreePacket;
  FreeServerPacketFunc FreeServerPacket;
  GetGameInfoFunc GetGameInfo;
  void* func6;
  InitializeFunc Initialize;
  void* func8;
  EnumDevicesFunc EnumDevices;
  ReceiveGamesListFunc ReceiveGamesList;
  ReceivePacketFunc ReceivePacket;
  ReceiveServerPacketFunc ReceiveServerPacket;
  // called from SNetSelectGame - does something with loading resources, look at this in non-bnet
  // snp. this actually does a similar thing to login, it creates a dialog and doesn't return until
  // exit/a game is selected to join/create
  void* func13;
  SendPacketFunc SendPacket;
  SendCommandFunc SendCommand;
  BroadcastGameFunc BroadcastGame;
  StopBroadcastingGameFunc StopBroadcastingGame;
  FreeDeviceDataFunc FreeDeviceData;
  FindGamesFunc FindGames;
  void* func20;
  ReportGameResultFunc ReportGameResult;
  void* func22;
  void* func23;
  void* func24;
  GetLeagueIdFunc GetLeagueId;
  DoLeagueLogoutFunc DoLeagueLogout;
  GetReplyTargetFunc GetReplyTarget;
};

void InitSnpStructs();
const SNetSnpListEntry* GetSnpListEntry();

}  // namespace snp
}  // namespace sbat

BOOL __stdcall SnpBind(uint32 index, sbat::snp::SnpFunctions** functions);
