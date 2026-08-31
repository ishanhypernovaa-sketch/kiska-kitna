// Kiska Kitna? - script.js
// Script placed at end of <body> so all DOM elements exist on execution.

var state = emptyGroupState();
var groupStore = { version: 2, activeGroupId: null, groups: [] };
var modalSt = { editingId: null, splitType: 'equal', payerMode: 'single', people: [] };
var LEGACY_STORAGE_KEY = 'kiska-kitna:state:v1';
var STORAGE_KEY = 'kiska-kitna:groups:v2';
var RECOVERY_STORAGE_KEY = 'kiska-kitna:recovery:v2';
var MUTATION_LOCK_PREFIX = 'kiska-kitna:mutation-lock:v2:';
var STORAGE_VERSION = 2;
var STATE_VERSION = 1;
var RECOVERY_HISTORY_VERSION = 1;
var MAX_RECOVERY_ENTRIES = 3;
var MAX_RECOVERY_HISTORY_BYTES = 2 * 1024 * 1024;
var BACKUP_APP = 'kiska-kitna';
var BACKUP_VERSION = 1;
var CURRENT_GROUP_BACKUP_VERSION = 2;
var ALL_GROUPS_BACKUP_VERSION = 2;
var MAX_BACKUP_BYTES = 10 * 1024 * 1024;
var MAX_GROUPS = 200;
var MAX_PEOPLE_PER_GROUP = 200;
var MAX_EXPENSES_PER_GROUP = 5000;
var MAX_PARTICIPANTS_PER_EXPENSE = 200;
var MAX_PAYERS_PER_EXPENSE = 200;
var MAX_GROUP_NAME_LENGTH = 60;
var MAX_PERSON_NAME_LENGTH = 40;
var MAX_EXPENSE_NAME_LENGTH = 60;
var MAX_ID_LENGTH = 100;
var MAX_EXPENSE_AMOUNT = 1000000000000;
var EXPENSE_RENDER_BATCH = 50;
var restoreWarning = '';
var storageWarningShown = false;
var pendingRecoveryRaw = null;
var storageReadUnavailable = false;
var lastKnownStoreRaw = null;
var visibleExpenseCount = EXPENSE_RENDER_BATCH;
var renderedExpenseGroupId = null;

// DOM refs
var elStart    = document.getElementById('startBtn');
var elApp      = document.getElementById('app');
var elGroup    = document.getElementById('groupNameInput');
var elPName    = document.getElementById('personNameInput');
var elAddP     = document.getElementById('addPersonBtn');
var elPErr     = document.getElementById('personError');
var elPList    = document.getElementById('peopleList');
var elPEmpty   = document.getElementById('peopleEmptyState');
var elAddExp   = document.getElementById('addExpenseBtn');
var elExpEmpty = document.getElementById('expensesEmptyState');
var elExpList  = document.getElementById('expenseList');
var elExpenseHistoryControls = document.getElementById('expenseHistoryControls');
var elExpenseHistoryStatus = document.getElementById('expenseHistoryStatus');
var elShowOlderExpenses = document.getElementById('showOlderExpensesBtn');
var elMOv      = document.getElementById('modalOverlay');
var elMTitle   = document.getElementById('modalTitle');
var elMSave    = document.getElementById('modalSaveBtn');
var elExpName  = document.getElementById('expName');
var elExpAmt   = document.getElementById('expAmount');
var elPaidBy   = document.getElementById('expPaidBy');
var elPBoxes   = document.getElementById('participantCheckboxes');
var elSelAll   = document.getElementById('selectAllBtn');
var elTabs     = document.getElementById('splitTabs');
var elSharesSec= document.getElementById('sharesSection');
var elSharesLabel = document.getElementById('sharesLabel');
var elSharesDis= document.getElementById('sharesDisplay');
var elExpErr   = document.getElementById('expenseError');
var elExpNameErr = document.getElementById('expenseNameError');
var elExpAmtErr = document.getElementById('expenseAmountError');
var elParticipantErr = document.getElementById('participantError');
var elParticipantSummary = document.getElementById('participantSummary');
var elSplitProgress = document.getElementById('splitProgress');
var elChargeErr = document.getElementById('chargeError');
var elExpenseReview = document.getElementById('expenseReview');
var elReviewName = document.getElementById('reviewName');
var elReviewAmount = document.getElementById('reviewAmount');
var elReviewPayer = document.getElementById('reviewPayer');
var elReviewSplit = document.getElementById('reviewSplit');

// Charges DOM refs
var elChargesToggle = document.getElementById('chargesToggle');
var elChargesSec    = document.getElementById('chargesSec');
var elGst           = document.getElementById('expGst');
var elSvc           = document.getElementById('expSvc');
var elTip           = document.getElementById('expTip');
var elDisc          = document.getElementById('expDisc');
var elBdBox         = document.getElementById('breakdownBox');
var elBdBase        = document.getElementById('bdBase');
var elBdGstRow      = document.getElementById('bdGstRow');
var elBdGst         = document.getElementById('bdGst');
var elBdGstLbl      = document.getElementById('bdGstLbl');
var elBdSvcRow      = document.getElementById('bdSvcRow');
var elBdSvc         = document.getElementById('bdSvc');
var elBdTipRow      = document.getElementById('bdTipRow');
var elBdTip         = document.getElementById('bdTip');
var elBdDiscRow     = document.getElementById('bdDiscRow');
var elBdDisc        = document.getElementById('bdDisc');
var elBdFinal       = document.getElementById('bdFinal');

// Payer-mode DOM refs
var elPayerModeTabs  = document.getElementById('payerModeTabs');
var elSinglePayerSec = document.getElementById('singlePayerSec');
var elPayerChoiceList= document.getElementById('payerChoiceList');
var elMultiPayerSec  = document.getElementById('multiPayerSec');
var elPayerInputsList= document.getElementById('payerInputsList');
var elSplitPayBtn    = document.getElementById('splitPayBtn');
var elClearPayBtn    = document.getElementById('clearPayBtn');
var elPayerTotalDisp = document.getElementById('payerTotalDisplay');
var elPayerErr       = document.getElementById('payerError');
var elSwitchConfirm  = document.getElementById('switchConfirmSec');
var elSwitchYes      = document.getElementById('switchConfirmYes');
var elSwitchNo       = document.getElementById('switchConfirmNo');
var elSettlement     = document.getElementById('settlementBody');
var elPastMembers    = document.getElementById('pastMembersNote');
var elConfirmOverlay = document.getElementById('confirmOverlay');
var elConfirmTitle   = document.getElementById('confirmTitle');
var elConfirmMessage = document.getElementById('confirmMessage');
var elConfirmCancel  = document.getElementById('confirmCancelBtn');
var elConfirmAction  = document.getElementById('confirmActionBtn');
var elResetGroup     = document.getElementById('resetGroupBtn');
var elExportBackup   = document.getElementById('exportBackupBtn');
var elImportBackup   = document.getElementById('importBackupBtn');
var elImportFile     = document.getElementById('importBackupFile');
var elBackupStatus   = document.getElementById('backupStatus');
var elExportAllBackup= document.getElementById('exportAllBackupBtn');
var elGroupDashboard = document.getElementById('groupDashboard');
var elGroupWorkspace = document.getElementById('groupWorkspace');
var elGroupList      = document.getElementById('groupList');
var elGroupListEmpty = document.getElementById('groupListEmpty');
var elNewGroup       = document.getElementById('newGroupBtn');
var elEmptyNewGroup  = document.getElementById('emptyNewGroupBtn');
var elAllGroups      = document.getElementById('allGroupsBtn');
var elActiveGroupName= document.getElementById('activeGroupName');
var elRenameGroup    = document.getElementById('renameGroupBtn');
var elDuplicateGroup = document.getElementById('duplicateGroupBtn');
var elDeleteGroup    = document.getElementById('deleteGroupBtn');
var elCompleteGroup  = document.getElementById('completeGroupBtn');
var elArchiveGroup   = document.getElementById('archiveGroupBtn');
var elRestoreGroup   = document.getElementById('restoreGroupBtn');
var elActiveGroupStatus = document.getElementById('activeGroupStatus');
var elArchivedGroupsSection = document.getElementById('archivedGroupsSection');
var elArchivedGroupCount = document.getElementById('archivedGroupCount');
var elArchivedGroupList = document.getElementById('archivedGroupList');
var elGroupReadonlyNote = document.getElementById('groupReadonlyNote');
var elGroupReadonlyTitle = document.getElementById('groupReadonlyTitle');
var elGroupEditor    = document.getElementById('groupEditorOverlay');
var elGroupEditorTitle = document.getElementById('groupEditorTitle');
var elGroupEditorHint= document.getElementById('groupEditorHint');
var elGroupEditorName= document.getElementById('groupEditorName');
var elGroupEditorError= document.getElementById('groupEditorError');
var elGroupEditorCancel= document.getElementById('groupEditorCancel');
var elGroupEditorSave= document.getElementById('groupEditorSave');
var elDashboardImport= document.getElementById('dashboardImportBtn');
var elDashboardExportAll= document.getElementById('dashboardExportAllBtn');
var elGroupBackupStatus= document.getElementById('groupBackupStatus');
var modalReturnFocus = null;
var confirmAction = null;
var confirmReturnFocus = null;
var groupEditorMode = 'create';
var groupEditorReturnFocus = null;

function emptyGroupState() {
  return { groupName: '', people: [], archivedPeople: [], expenses: [] };
}

function isValidAmount(value, allowZero) {
  return typeof value === 'number' && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);
}

function isUnsafeUserKey(value) {
  var normalized = value.toLowerCase();
  return normalized === '__proto__' || normalized === 'constructor' || normalized === 'prototype';
}

function sanitizePeople(value) {
  if (!Array.isArray(value) || value.length > MAX_PEOPLE_PER_GROUP) return null;
  var seen = Object.create(null);
  var people = [];
  for (var i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string' || !value[i].trim() || isUnsafeUserKey(value[i])
        || value[i].length > MAX_PERSON_NAME_LENGTH) return null;
    var key = value[i].toLowerCase();
    if (seen[key]) return null;
    seen[key] = true;
    people.push(value[i]);
  }
  return people;
}

function sanitizeExpense(exp) {
  if (!exp || typeof exp !== 'object' || Array.isArray(exp)
    || typeof exp.id !== 'string' || !exp.id || exp.id.length > MAX_ID_LENGTH
    || typeof exp.name !== 'string' || !exp.name || exp.name.length > MAX_EXPENSE_NAME_LENGTH
    || !isSafeMoney(exp.base, false) || exp.base > MAX_EXPENSE_AMOUNT
    || !isSafeMoney(exp.amount, false) || exp.amount > MAX_EXPENSE_AMOUNT
      || ['equal', 'custom'].indexOf(exp.splitType) === -1) return null;

  if (!isSafeMoney(exp.tip, true) || exp.tip > MAX_EXPENSE_AMOUNT
    || !isSafeMoney(exp.disc, true) || exp.disc > MAX_EXPENSE_AMOUNT
    || !isSafeMoney(exp.gst, true) || exp.gst > 100
    || !isSafeMoney(exp.svc, true) || exp.svc > 100) return null;
  if (!Array.isArray(exp.payments) || exp.payments.length === 0
    || exp.payments.length > MAX_PAYERS_PER_EXPENSE
      || !Array.isArray(exp.participants) || exp.participants.length === 0
    || exp.participants.length > MAX_PARTICIPANTS_PER_EXPENSE
    || !exp.shares || typeof exp.shares !== 'object' || Array.isArray(exp.shares)) return null;

  var payments = [];
  var payerNames = Object.create(null);
  var paymentPaise = 0;
  for (var j = 0; j < exp.payments.length; j++) {
    var payment = exp.payments[j];
    if (!payment || typeof payment.person !== 'string' || !payment.person.trim()
    || isUnsafeUserKey(payment.person) || payment.person.length > MAX_PERSON_NAME_LENGTH
    || payerNames[payment.person.toLowerCase()]
    || !isSafeMoney(payment.amount, false) || payment.amount > MAX_EXPENSE_AMOUNT) return null;
    payerNames[payment.person.toLowerCase()] = true;
    payments.push({ person: payment.person, amount: payment.amount });
    paymentPaise = safePaiseSum(paymentPaise, Math.round(payment.amount * 100));
    if (paymentPaise === null) return null;
  }

  var participants = [];
  var shares = Object.create(null);
  var sharePaise = 0;
  for (var k = 0; k < exp.participants.length; k++) {
    var person = exp.participants[k];
    if (typeof person !== 'string' || !person.trim() || isUnsafeUserKey(person)
      || participants.some(function(existing) { return existing.toLowerCase() === person.toLowerCase(); })
        || !Object.prototype.hasOwnProperty.call(exp.shares, person)
        || person.length > MAX_PERSON_NAME_LENGTH
        || !isSafeMoney(exp.shares[person], true)
        || exp.shares[person] > MAX_EXPENSE_AMOUNT) return null;
    participants.push(person);
    shares[person] = exp.shares[person];
    sharePaise = safePaiseSum(sharePaise, Math.round(exp.shares[person] * 100));
    if (sharePaise === null) return null;
  }

  var amountPaise = Math.round(exp.amount * 100);
  if (paymentPaise !== amountPaise || sharePaise !== amountPaise) return null;
  var paidBy = exp.paidBy === null ? null : exp.paidBy;
  if (paidBy !== null && (typeof paidBy !== 'string' || !paidBy)) return null;
  return {
    id: exp.id, name: exp.name, base: exp.base, gst: exp.gst, svc: exp.svc,
    tip: exp.tip, disc: exp.disc, amount: exp.amount, paidBy: paidBy,
    payments: payments, splitType: exp.splitType, participants: participants, shares: shares
  };
}

function validateExpenseForSave(expense, allowedPeople) {
  if (!sanitizeExpense(expense) || !isSafeMoney(expense.base, false)
      || !isSafeMoney(expense.amount, false) || !isSafeMoney(expense.tip, true)
      || !isSafeMoney(expense.disc, true) || !Number.isFinite(expense.gst)
      || !Number.isFinite(expense.svc) || expense.gst < 0 || expense.gst > 100
      || expense.svc < 0 || expense.svc > 100
      || Math.abs(expense.gst * 100 - Math.round(expense.gst * 100)) >= 0.000001
      || Math.abs(expense.svc * 100 - Math.round(expense.svc * 100)) >= 0.000001) {
    return 'Expense contains an invalid amount. Use whole paise only.';
  }
  var calculatedPaise = Math.round(calcFinal(
    expense.base, expense.gst, expense.svc, expense.tip, expense.disc
  ).final * 100);
  if (calculatedPaise !== Math.round(expense.amount * 100)) {
    return 'Final amount does not match the entered charges.';
  }
  var payerNames = [];
  for (var i = 0; i < expense.payments.length; i++) {
    var payment = expense.payments[i];
    if (allowedPeople.indexOf(payment.person) === -1 || payerNames.indexOf(payment.person) !== -1
        || !isSafeMoney(payment.amount, false)) return 'Expense contains an invalid payer amount.';
    payerNames.push(payment.person);
  }
  for (var j = 0; j < expense.participants.length; j++) {
    var person = expense.participants[j];
    if (allowedPeople.indexOf(person) === -1 || !isSafeMoney(expense.shares[person], true)) {
      return 'Expense contains an invalid participant share.';
    }
  }
  return '';
}

function sanitizeSavedState(payload) {
  if (!payload || payload.version !== STATE_VERSION || !payload.state
  || typeof payload.state.groupName !== 'string'
  || payload.state.groupName.length > MAX_GROUP_NAME_LENGTH) return null;
  var people = sanitizePeople(payload.state.people);
  var archivedPeople = sanitizePeople(payload.state.archivedPeople);
  if (!people || !archivedPeople || people.length + archivedPeople.length > MAX_PEOPLE_PER_GROUP
      || !Array.isArray(payload.state.expenses)
      || payload.state.expenses.length > MAX_EXPENSES_PER_GROUP) return null;

  var allNames = Object.create(null);
  var hasDuplicateName = false;
  people.concat(archivedPeople).forEach(function(person) {
    var key = person.toLowerCase();
    if (allNames[key]) hasDuplicateName = true;
    allNames[key] = person;
  });
  if (hasDuplicateName) return null;

  var expenses = [];
  var expenseIds = Object.create(null);
  var hasMismatchedHistoricalName = false;
  for (var i = 0; i < payload.state.expenses.length; i++) {
    var expense = sanitizeExpense(payload.state.expenses[i]);
    if (!expense || expenseIds[expense.id]) return null;
    expenseIds[expense.id] = true;
    expenses.push(expense);
    expensePeople(expense).forEach(function(person) {
      var key = person.toLowerCase();
      if (!allNames[key]) {
        archivedPeople.push(person);
        allNames[key] = person;
      } else if (allNames[key] !== person) {
        hasMismatchedHistoricalName = true;
      }
    });
  }
  archivedPeople = sanitizePeople(archivedPeople);
  if (!archivedPeople || people.length + archivedPeople.length > MAX_PEOPLE_PER_GROUP
      || hasMismatchedHistoricalName) return null;
  var restored = { groupName: payload.state.groupName, people: people, archivedPeople: archivedPeople, expenses: expenses };
  return hasSafeAggregateAccounting(restored) ? restored : null;
}

function safePaiseSum(total, value) {
  var next = total + value;
  return Number.isSafeInteger(total) && Number.isSafeInteger(value) && Number.isSafeInteger(next) ? next : null;
}

function hasSafeAggregateAccounting(group) {
  var expenseTotal = 0;
  var paidTotal = 0;
  var owedTotal = 0;
  var paidByPerson = Object.create(null);
  var owedByPerson = Object.create(null);
  for (var i = 0; i < group.expenses.length; i++) {
    var expense = group.expenses[i];
    var amountPaise = Math.round(expense.amount * 100);
    expenseTotal = safePaiseSum(expenseTotal, amountPaise);
    if (expenseTotal === null) return false;
    for (var j = 0; j < expense.payments.length; j++) {
      var payment = expense.payments[j];
      var paymentPaise = Math.round(payment.amount * 100);
      paidTotal = safePaiseSum(paidTotal, paymentPaise);
      paidByPerson[payment.person] = safePaiseSum(paidByPerson[payment.person] || 0, paymentPaise);
      if (paidTotal === null || paidByPerson[payment.person] === null) return false;
    }
    for (var k = 0; k < expense.participants.length; k++) {
      var person = expense.participants[k];
      var sharePaise = Math.round(expense.shares[person] * 100);
      owedTotal = safePaiseSum(owedTotal, sharePaise);
      owedByPerson[person] = safePaiseSum(owedByPerson[person] || 0, sharePaise);
      if (owedTotal === null || owedByPerson[person] === null) return false;
    }
  }
  if (paidTotal !== expenseTotal || owedTotal !== expenseTotal) return false;
  var people = Object.create(null);
  Object.keys(paidByPerson).forEach(function(person) { people[person] = true; });
  Object.keys(owedByPerson).forEach(function(person) { people[person] = true; });
  return Object.keys(people).every(function(person) {
    return Number.isSafeInteger((paidByPerson[person] || 0) - (owedByPerson[person] || 0));
  });
}

function validTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function genGroupId() {
  return 'g' + Date.now() + Math.random().toString(36).slice(2, 8);
}

function createGroupRecord(groupState, metadata) {
  var now = new Date().toISOString();
  return {
    id: metadata && metadata.id ? metadata.id : genGroupId(),
    groupName: groupState.groupName,
    people: groupState.people,
    archivedPeople: groupState.archivedPeople,
    expenses: groupState.expenses,
    status: metadata && ['active', 'completed', 'archived'].indexOf(metadata.status) !== -1 ? metadata.status : 'active',
    createdAt: metadata && metadata.createdAt ? metadata.createdAt : now,
    updatedAt: metadata && metadata.updatedAt ? metadata.updatedAt : now
  };
}

function sanitizeGroupRecord(value) {
  if (!value || typeof value.id !== 'string' || !value.id || value.id.length > MAX_ID_LENGTH
      || typeof value.groupName !== 'string' || !value.groupName.trim()
      || value.groupName.length > MAX_GROUP_NAME_LENGTH
    || ['active', 'completed', 'archived'].indexOf(value.status) === -1
      || !validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt)) return null;
  var restored = sanitizeSavedState({ version: STATE_VERSION, state: value });
  return restored ? createGroupRecord(restored, {
    id: value.id,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  }) : null;
}

function sanitizeGroupStore(payload) {
  if (!payload || payload.version !== STORAGE_VERSION || !Array.isArray(payload.groups)
  || payload.groups.length > MAX_GROUPS
  || !Object.prototype.hasOwnProperty.call(payload, 'activeGroupId')) return null;
  var groups = [];
  var ids = Object.create(null);
  for (var i = 0; i < payload.groups.length; i++) {
    var value = payload.groups[i];
    var group = sanitizeGroupRecord(value);
    if (!group || ids[group.id]) return null;
    ids[group.id] = true;
    groups.push(group);
  }
  if (payload.activeGroupId !== null
      && (typeof payload.activeGroupId !== 'string' || !ids[payload.activeGroupId])) return null;
  var activeGroupId = payload.activeGroupId;
  return { version: STORAGE_VERSION, activeGroupId: activeGroupId, groups: groups };
}

function recoverGroupStore(payload) {
  if (!payload || payload.version !== STORAGE_VERSION || !Array.isArray(payload.groups)
      || payload.groups.length > MAX_GROUPS) return null;
  var groups = [];
  var ids = Object.create(null);
  var rejectedCount = 0;
  for (var i = 0; i < payload.groups.length; i++) {
    var group = sanitizeGroupRecord(payload.groups[i]);
    if (!group || ids[group.id]) {
      rejectedCount++;
      continue;
    }
    ids[group.id] = true;
    groups.push(group);
  }
  var hasActiveId = Object.prototype.hasOwnProperty.call(payload, 'activeGroupId');
  var requestedActiveId = typeof payload.activeGroupId === 'string' ? payload.activeGroupId : null;
  var activeGroupId = hasActiveId && payload.activeGroupId === null
    ? null
    : (requestedActiveId && ids[requestedActiveId]
      ? requestedActiveId : (groups.length ? groups[0].id : null));
  return {
    store: { version: STORAGE_VERSION, activeGroupId: activeGroupId, groups: groups },
    rejectedCount: rejectedCount,
    needsRepair: rejectedCount > 0 || payload.activeGroupId !== activeGroupId
  };
}

function activeGroup() {
  return groupStore.groups.find(function(group) { return group.id === groupStore.activeGroupId; }) || null;
}

function showStorageFailure() {
  showToast("Couldn't save your changes. Your previous data is still intact.");
}

function showStorageConflict() {
  showToast('Your data changed in another tab. Latest saved data was kept; please try again.');
}

function persistStore(storeToPersist) {
  try {
    var raw = JSON.stringify(storeToPersist);
    localStorage.setItem(STORAGE_KEY, raw);
    lastKnownStoreRaw = raw;
    return true;
  } catch (error) {
    storageWarningShown = true;
    showStorageFailure();
    return false;
  }
}

function cloneGroupStore() {
  return JSON.parse(JSON.stringify(groupStore));
}

function activeGroupIn(store) {
  return store.groups.find(function(group) { return group.id === store.activeGroupId; }) || null;
}

function acquireMutationLock() {
  var owner = genId();
  var ownKey = MUTATION_LOCK_PREFIX + owner;
  try {
    var now = Date.now();
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (!key || key.indexOf(MUTATION_LOCK_PREFIX) !== 0) continue;
      var contender = JSON.parse(localStorage.getItem(key) || 'null');
      if (!contender || contender.expiresAt <= now) localStorage.removeItem(key);
    }
    localStorage.setItem(ownKey, JSON.stringify({ owner: owner, choosing: true, ticket: 0, expiresAt: now + 10000 }));
    var maxTicket = 0;
    for (var registeredIndex = 0; registeredIndex < localStorage.length; registeredIndex++) {
      var registeredKey = localStorage.key(registeredIndex);
      if (!registeredKey || registeredKey === ownKey || registeredKey.indexOf(MUTATION_LOCK_PREFIX) !== 0) continue;
      var registered = JSON.parse(localStorage.getItem(registeredKey) || 'null');
      if (!registered || registered.expiresAt <= now) continue;
      if (registered.choosing) {
        localStorage.removeItem(ownKey);
        return null;
      }
      maxTicket = Math.max(maxTicket, registered.ticket);
    }
    var mine = { owner: owner, choosing: false, ticket: maxTicket + 1, expiresAt: now + 10000 };
    localStorage.setItem(ownKey, JSON.stringify(mine));
    for (var j = 0; j < localStorage.length; j++) {
      var contenderKey = localStorage.key(j);
      if (!contenderKey || contenderKey === ownKey || contenderKey.indexOf(MUTATION_LOCK_PREFIX) !== 0) continue;
      var other = JSON.parse(localStorage.getItem(contenderKey) || 'null');
      if (!other || other.expiresAt <= now) continue;
      if (other.choosing || other.ticket < mine.ticket
          || (other.ticket === mine.ticket && other.owner < mine.owner)) {
        localStorage.removeItem(ownKey);
        return null;
      }
    }
    return ownKey;
  } catch (error) {
    try { localStorage.removeItem(ownKey); } catch (cleanupError) {}
    return null;
  }
}

function releaseMutationLock(ownKey) {
  try {
    localStorage.removeItem(ownKey);
  } catch (error) {}
}

async function commitStoreMutation(mutator) {
  if (storageReadUnavailable) {
    storageReadUnavailable = false;
    restoreState();
    if (storageReadUnavailable) {
      showStorageFailure();
      return false;
    }
  }
  if (navigator.locks && navigator.locks.request) {
    return navigator.locks.request('kiska-kitna:store:v2', function() {
      return commitStoreMutationLocked(mutator);
    });
  }
  var lockOwner = acquireMutationLock();
  if (!lockOwner) {
    showStorageConflict();
    return false;
  }
  try {
    return commitStoreMutationLocked(mutator);
  } finally {
    releaseMutationLock(lockOwner);
  }
}

function commitStoreMutationLocked(mutator) {
  var proposed;
  var latestRaw;
  try {
    latestRaw = localStorage.getItem(STORAGE_KEY);
    if (latestRaw) {
      var latestRecovery = recoverGroupStore(JSON.parse(latestRaw));
      if (!latestRecovery) throw new Error('Latest saved data is invalid');
      if (latestRecovery.needsRepair && latestRecovery.rejectedCount > 0
          && !quarantineRawStore(latestRaw)) {
        showStorageFailure();
        return false;
      }
      proposed = latestRecovery.store;
    } else {
      proposed = { version: STORAGE_VERSION, activeGroupId: null, groups: [] };
    }
    mutator(proposed);
  } catch (error) {
    if (latestRaw !== lastKnownStoreRaw) showStorageConflict();
    else showStorageFailure();
    return false;
  }
  var validated = sanitizeGroupStore(proposed);
  if (!validated) {
    showStorageFailure();
    return false;
  }
  if (pendingRecoveryRaw) {
    if (!quarantineRawStore(pendingRecoveryRaw)) {
      showStorageFailure();
      return false;
    }
    pendingRecoveryRaw = null;
  }
  if (localStorage.getItem(STORAGE_KEY) !== latestRaw) {
    showStorageConflict();
    return false;
  }
  if (!persistStore(validated)) return false;
  groupStore = validated;
  state = activeGroup() || emptyGroupState();
  return true;
}

async function commitActiveGroupMutation(mutator) {
  var currentGroup = activeGroup();
  var groupId = currentGroup && currentGroup.id;
  return commitStoreMutation(function(proposed) {
    var group = proposed.groups.find(function(item) { return item.id === groupId; });
    if (!group) throw new Error('Active group is unavailable');
    mutator(group);
    group.updatedAt = new Date().toISOString();
    proposed.activeGroupId = groupId;
  });
}

function recoveryByteLength(value) {
  return typeof TextEncoder === 'function'
    ? new TextEncoder().encode(value).byteLength
    : new Blob([value]).size;
}

function recoveryHistoryFromStored(stored) {
  if (!stored) return { version: RECOVERY_HISTORY_VERSION, entries: [] };
  if (recoveryByteLength(stored) > MAX_RECOVERY_HISTORY_BYTES) return null;
  try {
    var parsed = JSON.parse(stored);
    var ids = Object.create(null);
    var payloads = Object.create(null);
    if (hasExactKeys(parsed, ['version', 'entries'])
        && parsed.version === RECOVERY_HISTORY_VERSION
        && Array.isArray(parsed.entries)
        && parsed.entries.length <= MAX_RECOVERY_ENTRIES
        && parsed.entries.every(function(entry) {
          if (!hasExactKeys(entry, ['id', 'capturedAt', 'raw'])
              || typeof entry.id !== 'string' || !entry.id || entry.id.length > MAX_ID_LENGTH
              || ids[entry.id] || !validTimestamp(entry.capturedAt)
              || new Date(entry.capturedAt).toISOString() !== entry.capturedAt
              || typeof entry.raw !== 'string' || !entry.raw
              || recoveryByteLength(entry.raw) > MAX_RECOVERY_HISTORY_BYTES
              || payloads[entry.raw]) return false;
          ids[entry.id] = true;
          payloads[entry.raw] = true;
          return true;
        })) return parsed;
  } catch (error) {}
  return {
    version: RECOVERY_HISTORY_VERSION,
    entries: [{ id: genId(), capturedAt: new Date().toISOString(), raw: stored }]
  };
}

function quarantineRawStore(raw) {
  if (typeof raw !== 'string' || !raw || recoveryByteLength(raw) > MAX_RECOVERY_HISTORY_BYTES) return false;
  try {
    var stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (stored === raw) return true;
    var history = recoveryHistoryFromStored(stored);
    if (!history) return false;
    if (history.entries.some(function(entry) { return entry.raw === raw; })) return true;
    history.entries.push({ id: genId(), capturedAt: new Date().toISOString(), raw: raw });
    while (history.entries.length > MAX_RECOVERY_ENTRIES) history.entries.shift();
    var serialized = JSON.stringify(history);
    while (recoveryByteLength(serialized) > MAX_RECOVERY_HISTORY_BYTES && history.entries.length > 1) {
      history.entries.shift();
      serialized = JSON.stringify(history);
    }
    if (recoveryByteLength(serialized) > MAX_RECOVERY_HISTORY_BYTES) return false;
    localStorage.setItem(RECOVERY_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    return false;
  }
}

function restoreState() {
  var legacyRaw = null;
  var storageReadFailed = false;
  try {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (error) {
      storageReadFailed = true;
      throw error;
    }
    if (raw) {
      var recovery = recoverGroupStore(JSON.parse(raw));
      if (!recovery) throw new Error('Invalid group store');
      groupStore = recovery.store;
      state = activeGroup() || emptyGroupState();
      lastKnownStoreRaw = raw;
      if (recovery.needsRepair) {
        var rawPreserved = recovery.rejectedCount === 0 || quarantineRawStore(raw);
        if (!rawPreserved) pendingRecoveryRaw = raw;
        if (rawPreserved) persistStore(recovery.store);
        restoreWarning = recovery.rejectedCount
          ? recovery.rejectedCount + ' damaged group' + (recovery.rejectedCount === 1 ? ' was' : 's were') + ' skipped. Valid groups were recovered.'
          : 'The active group reference was repaired.';
      }
      return;
    }
    try { legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY); } catch (error) {
      storageReadFailed = true;
      throw error;
    }
  } catch (error) {
    if (storageReadFailed) storageReadUnavailable = true;
    if (typeof raw === 'string' && raw && !quarantineRawStore(raw)) pendingRecoveryRaw = raw;
    groupStore = { version: STORAGE_VERSION, activeGroupId: null, groups: [] };
    state = emptyGroupState();
    lastKnownStoreRaw = typeof raw === 'string' ? raw : null;
    restoreWarning = 'Some saved group data was invalid and was left untouched for recovery.';
  }

  if (storageReadUnavailable || pendingRecoveryRaw) return;

  if (!legacyRaw) {
    try { legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY); } catch (error) {
      storageReadUnavailable = true;
      return;
    }
  }
  if (!legacyRaw) return;
  try {
    var legacyState = sanitizeSavedState(JSON.parse(legacyRaw));
    if (!legacyState) throw new Error('Invalid legacy state');
    var hasData = legacyState.groupName.trim() || legacyState.people.length || legacyState.expenses.length;
    if (!hasData) return;
    legacyState.groupName = legacyState.groupName.trim() || 'Untitled Group';
    var migrated = createGroupRecord(legacyState);
    var migratedStore = { version: STORAGE_VERSION, activeGroupId: migrated.id, groups: [migrated] };
    if (persistStore(migratedStore)) {
      groupStore = migratedStore;
      state = migrated;
      try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (error) {
        console.warn('Legacy storage could not be removed after migration.');
      }
      restoreWarning = 'Your existing group was upgraded to Group History.';
    } else {
      restoreWarning = 'Your previous group could not be upgraded yet. Its saved data is still intact.';
    }
  } catch (error) {
    restoreWarning = 'Previous saved data was invalid and could not be migrated.';
  }
}

function groupTotal(group) {
  return group.expenses.reduce(function(total, expense) {
    return total + Math.round(expense.amount * 100);
  }, 0) / 100;
}

function updatedLabel(timestamp) {
  var updated = new Date(timestamp);
  var today = new Date();
  var startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var startUpdated = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate());
  var days = Math.round((startToday - startUpdated) / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return 'Updated ' + new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(updated);
}

function renderGroupDashboard() {
  var groups = groupStore.groups.slice().sort(function(a, b) {
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
  var visibleGroups = groups.filter(function(group) { return group.status !== 'archived'; });
  var archivedGroups = groups.filter(function(group) { return group.status === 'archived'; });
  elGroupList.innerHTML = '';
  elArchivedGroupList.innerHTML = '';
  elDashboardExportAll.disabled = groups.length === 0;
  elGroupListEmpty.hidden = visibleGroups.length !== 0;
  elArchivedGroupsSection.hidden = archivedGroups.length === 0;
  elArchivedGroupCount.textContent = archivedGroups.length;
  visibleGroups.forEach(function(group) {
    renderGroupListItem(group, elGroupList);
  });
  archivedGroups.forEach(function(group) {
    renderGroupListItem(group, elArchivedGroupList);
  });
}

function lifecycleLabel(group) {
  if (group.status === 'archived') return '&#128230; Archived';
  if (group.status === 'completed') return '&#10003; Completed';
  return 'Active';
}

function renderGroupListItem(group, list) {
    var item = document.createElement('li');
    item.className = 'group-list-item group-list-item--' + group.status
      + (group.id === groupStore.activeGroupId ? ' group-list-item--current' : '');
    item.innerHTML = '<button class="group-list-item__open" type="button">'
      + '<span class="group-list-item__icon" aria-hidden="true">&#128101;</span>'
      + '<span class="group-list-item__content"><strong>' + esc(group.groupName) + '</strong>'
      + '<span>' + group.people.length + (group.people.length === 1 ? ' person' : ' people')
      + ' &middot; ' + rupees(groupTotal(group)) + '</span><small>' + lifecycleLabel(group) + ' &middot; ' + updatedLabel(group.updatedAt) + '</small></span>'
      + (group.id === groupStore.activeGroupId ? '<span class="group-list-item__active">Open</span>' : '')
      + '<span class="group-list-item__arrow" aria-hidden="true">&#8594;</span></button>';
    item.querySelector('button').addEventListener('click', function() { openGroup(group.id); });
    list.appendChild(item);
}

function showDashboard() {
  if (!elMOv.hidden) closeModal();
  elGroupWorkspace.hidden = true;
  elGroupDashboard.hidden = false;
  renderGroupDashboard();
  elGroupDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderActiveGroup() {
  var group = activeGroup();
  if (!group) { showDashboard(); return; }
  state = group;
  elGroup.value = state.groupName;
  elActiveGroupName.textContent = state.groupName;
  var readOnly = state.status !== 'active';
  elActiveGroupStatus.textContent = state.status === 'archived' ? 'Archived group' : (state.status === 'completed' ? 'Completed group' : 'Active group');
  elGroupWorkspace.classList.toggle('group-workspace--readonly', readOnly);
  elGroupReadonlyNote.hidden = !readOnly;
  elGroupReadonlyTitle.textContent = state.status === 'archived' ? 'Archived group' : 'Completed group';
  elCompleteGroup.hidden = state.status !== 'active';
  elArchiveGroup.hidden = state.status !== 'completed';
  elRestoreGroup.hidden = state.status === 'active';
  elRenameGroup.hidden = readOnly;
  elGroup.disabled = readOnly;
  elPName.disabled = readOnly;
  elAddP.disabled = readOnly;
  elResetGroup.disabled = readOnly;
  elPName.value = '';
  elPErr.textContent = '';
  elPName.setAttribute('aria-invalid', 'false');
  renderPeople();
  renderExpenses();
  refreshExpBtn();
}

async function openGroup(groupId) {
  var group = groupStore.groups.find(function(item) { return item.id === groupId; });
  if (!group) { showToast('That group is no longer available.'); showDashboard(); return; }
  if (groupStore.activeGroupId !== group.id && !await commitStoreMutation(function(proposed) {
    proposed.activeGroupId = group.id;
  })) return;
  elGroupDashboard.hidden = true;
  elGroupWorkspace.hidden = false;
  renderActiveGroup();
  elApp.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openGroupEditor(mode) {
  groupEditorMode = mode;
  groupEditorReturnFocus = document.activeElement;
  var editing = mode === 'rename';
  elGroupEditorTitle.textContent = editing ? 'Rename Group' : 'New Group';
  elGroupEditorHint.textContent = editing ? 'Update the name without changing this group\'s history.' : 'Give this group a clear name.';
  elGroupEditorSave.textContent = editing ? 'Save Name' : 'Create Group';
  elGroupEditorName.value = editing && activeGroup() ? activeGroup().groupName : '';
  elGroupEditorError.textContent = '';
  elGroupEditorName.setAttribute('aria-invalid', 'false');
  elGroupEditor.hidden = false;
  elGroupEditor.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(function() { elGroupEditorName.focus(); elGroupEditorName.select(); }, 50);
}

function closeGroupEditor() {
  elGroupEditor.hidden = true;
  elGroupEditor.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  restoreDialogFocus(groupEditorReturnFocus, elNewGroup);
}

async function saveGroupEditor() {
  var name = elGroupEditorName.value.trim();
  if (!name) {
    elGroupEditorError.textContent = 'Enter a group name.';
    elGroupEditorName.setAttribute('aria-invalid', 'true');
    elGroupEditorName.focus();
    return;
  }
  elGroupEditorName.setAttribute('aria-invalid', 'false');
  if (groupEditorMode === 'rename') {
    var group = activeGroup();
    if (!group) { closeGroupEditor(); return; }
    if (!await commitActiveGroupMutation(function(proposedGroup) {
      proposedGroup.groupName = name;
    })) return;
    elGroup.value = name;
    elActiveGroupName.textContent = state.groupName;
    closeGroupEditor();
    showToast('Group renamed.');
    return;
  }
  if (groupStore.groups.length >= MAX_GROUPS) {
    elGroupEditorError.textContent = 'This browser already has the maximum of ' + MAX_GROUPS + ' groups.';
    return;
  }
  var newGroup = createGroupRecord({ groupName: name, people: [], archivedPeople: [], expenses: [] });
  if (!await commitStoreMutation(function(proposed) {
    proposed.groups.push(newGroup);
    proposed.activeGroupId = newGroup.id;
  })) return;
  closeGroupEditor();
  openGroup(newGroup.id);
  showToast('New group ready.');
}

async function duplicateActiveGroup() {
  var source = activeGroup();
  if (!source) return;
  if (groupStore.groups.length >= MAX_GROUPS) {
    showToast('Delete a group before creating another copy.');
    return;
  }
  var copyName = source.groupName.slice(0, 55).trimEnd() + ' Copy';
  var copiedState = JSON.parse(JSON.stringify({
    groupName: copyName,
    people: source.people,
    archivedPeople: source.archivedPeople,
    expenses: source.expenses
  }));
  var copy = createGroupRecord(copiedState);
  if (!await commitStoreMutation(function(proposed) {
    proposed.groups.push(copy);
    proposed.activeGroupId = copy.id;
  })) return;
  renderActiveGroup();
  showToast('Group duplicated as "' + copyName + '".');
}

function outstandingBalancePaise() {
  var balances = computeBalances().balances;
  return Object.keys(balances).reduce(function(total, person) {
    return total + Math.max(0, balances[person]);
  }, 0);
}

async function setGroupStatus(status) {
  var group = activeGroup();
  if (!group || ['active', 'completed', 'archived'].indexOf(status) === -1) return;
  if (!await commitActiveGroupMutation(function(proposedGroup) {
    proposedGroup.status = status;
  })) return false;
  renderActiveGroup();
  if (status === 'completed') elArchiveGroup.focus();
  else if (status === 'active') elCompleteGroup.focus();
  else elRestoreGroup.focus();
  showToast(status === 'completed' ? 'Group marked as completed.' : (status === 'archived' ? 'Group archived. Data is safely kept.' : 'Group restored to active.'));
  return true;
}

function requestCompleteGroup() {
  var group = activeGroup();
  if (!group || group.status !== 'active') return;
  var outstanding = outstandingBalancePaise();
  if (outstanding === 0) {
    setGroupStatus('completed');
    return;
  }
  openConfirmation(
    'Complete ' + group.groupName + '?',
    'This group still has outstanding balances. ' + rupees(outstanding / 100) + ' still needs to be received. Mark it completed anyway?',
    'Mark as Completed',
    function() { setGroupStatus('completed'); }
  );
}

function requestArchiveGroup() {
  var group = activeGroup();
  if (!group || group.status !== 'completed') return;
  openConfirmation(
    'Archive ' + group.groupName + '?',
    'Archiving keeps all people, expenses and settlement history. You can restore this group later.',
    'Archive Group',
    function() {
      if (setGroupStatus('archived')) {
        showDashboard();
        elArchivedGroupsSection.querySelector('summary').focus();
      }
    }
  );
}

function requestRestoreGroup() {
  var group = activeGroup();
  if (!group || group.status === 'active') return;
  openConfirmation(
    'Restore ' + group.groupName + '?',
    'This group will return to Active Groups and editing will be enabled. All existing data will stay unchanged.',
    'Restore Group',
    function() { setGroupStatus('active'); }
  );
}

function requestDeleteActiveGroup() {
  var group = activeGroup();
  if (!group) return;
  openConfirmation(
    'Delete ' + group.groupName + '?',
    'This will permanently remove this group\'s people and expenses from this browser. This cannot be undone unless you have an exported backup.',
    'Delete Group',
    function() { deleteGroup(group.id); }
  );
}

async function deleteGroup(groupId) {
  if (!await commitStoreMutation(function(proposed) {
    proposed.groups = proposed.groups.filter(function(group) { return group.id !== groupId; });
    proposed.activeGroupId = null;
  })) return;
  showDashboard();
  showToast('Group deleted.');
}

elNewGroup.addEventListener('click', function() { openGroupEditor('create'); });
elEmptyNewGroup.addEventListener('click', function() { openGroupEditor('create'); });
elAllGroups.addEventListener('click', showDashboard);
elRenameGroup.addEventListener('click', function() { openGroupEditor('rename'); });
elDuplicateGroup.addEventListener('click', duplicateActiveGroup);
elDeleteGroup.addEventListener('click', requestDeleteActiveGroup);
elCompleteGroup.addEventListener('click', requestCompleteGroup);
elArchiveGroup.addEventListener('click', requestArchiveGroup);
elRestoreGroup.addEventListener('click', requestRestoreGroup);
elGroupEditorCancel.addEventListener('click', closeGroupEditor);
elGroupEditorSave.addEventListener('click', saveGroupEditor);
elGroupEditorName.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') saveGroupEditor();
});
elGroupEditor.addEventListener('click', function(event) {
  if (event.target === elGroupEditor) closeGroupEditor();
});

function backupData() {
  return JSON.parse(JSON.stringify({
    groupName: state.groupName,
    people: state.people,
    archivedPeople: state.archivedPeople,
    expenses: state.expenses
  }));
}

function createBackup() {
  return {
    app: BACKUP_APP,
    version: CURRENT_GROUP_BACKUP_VERSION,
    type: 'current-group',
    exportedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(activeGroup()))
  };
}

function createAllGroupsBackup() {
  return {
    app: BACKUP_APP,
    version: ALL_GROUPS_BACKUP_VERSION,
    type: 'all-groups',
    exportedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify({
      activeGroupId: groupStore.activeGroupId,
      groups: groupStore.groups
    }))
  };
}

function backupFilename() {
  var group = state.groupName || 'new-group';
  if (group.normalize) group = group.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  group = group.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return 'kiska-kitna-' + (group || 'group') + '-backup.json';
}

function setBackupStatus(message, type) {
  elBackupStatus.textContent = message;
  elBackupStatus.className = 'backup-panel__status'
    + (type ? ' backup-panel__status--' + type : '');
  elGroupBackupStatus.textContent = message;
  elGroupBackupStatus.className = 'backup-panel__status group-home__backup-status'
    + (type ? ' backup-panel__status--' + type : '');
}

function exportJsonBackup(backup, filename, successMessage) {
  try {
    var json = JSON.stringify(backup, null, 2) + '\n';
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 0);
    setBackupStatus(successMessage, 'success');
    showToast(successMessage);
  } catch (error) {
    setBackupStatus('Backup could not be exported in this browser.', 'error');
    showToast('Backup export failed. Please try another browser.');
  }
}

function exportBackup() {
  exportJsonBackup(createBackup(), backupFilename(), 'Current group backup exported.');
}

function exportAllGroupsBackup() {
  var date = new Date().toISOString().slice(0, 10);
  exportJsonBackup(createAllGroupsBackup(), 'kiska-kitna-all-groups-' + date + '.json', 'All groups backup exported.');
}

function hasOnlyKeys(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every(function(key) { return allowedKeys.indexOf(key) !== -1; });
}

function isSafeMoney(value, allowZero) {
  return isValidAmount(value, allowZero)
    && Number.isSafeInteger(Math.round(value * 100))
    && value === Math.round(value * 100) / 100;
}

function hasExactKeys(value, keys) {
  return hasOnlyKeys(value, keys) && Object.keys(value).length === keys.length
    && keys.every(function(key) { return Object.prototype.hasOwnProperty.call(value, key); });
}

function validateImportedGroupData(data, allowEmptyGroupName) {
  var dataKeys = ['groupName', 'people', 'archivedPeople', 'expenses'];
  if (!hasExactKeys(data, dataKeys) || typeof data.groupName !== 'string'
  || (!allowEmptyGroupName && !data.groupName.trim())
      || data.groupName.length > MAX_GROUP_NAME_LENGTH
      || !Array.isArray(data.people) || !Array.isArray(data.archivedPeople)
      || data.people.length > MAX_PEOPLE_PER_GROUP
      || data.archivedPeople.length > MAX_PEOPLE_PER_GROUP
      || data.people.length + data.archivedPeople.length > MAX_PEOPLE_PER_GROUP
      || !Array.isArray(data.expenses) || data.expenses.length > MAX_EXPENSES_PER_GROUP) {
    return { error: 'The backup data structure or limits are invalid.' };
  }

  var people = sanitizePeople(data.people);
  var archivedPeople = sanitizePeople(data.archivedPeople);
  if (!people || !archivedPeople) return { error: 'The backup contains an invalid person.' };
  var knownPeople = new Set();
  for (var i = 0; i < people.length + archivedPeople.length; i++) {
    var person = i < people.length ? people[i] : archivedPeople[i - people.length];
    var normalizedName = person.toLocaleLowerCase();
    if (knownPeople.has(normalizedName)) return { error: 'The backup contains duplicate people.' };
    knownPeople.add(normalizedName);
  }
  var exactPeople = new Set(people.concat(archivedPeople));
  var expenseIds = new Set();
  var expenses = [];
  var expenseKeys = ['id', 'name', 'base', 'gst', 'svc', 'tip', 'disc', 'amount', 'paidBy', 'payments', 'splitType', 'participants', 'shares'];
  for (var j = 0; j < data.expenses.length; j++) {
    var sourceExpense = data.expenses[j];
    if (!hasExactKeys(sourceExpense, expenseKeys)) {
      return { error: 'An expense contains missing or unexpected fields.' };
    }
    if (typeof sourceExpense.id !== 'string' || !sourceExpense.id
        || sourceExpense.id.length > MAX_ID_LENGTH || expenseIds.has(sourceExpense.id)) {
      return { error: 'The backup contains an invalid or duplicate expense ID.' };
    }
    if (!Array.isArray(sourceExpense.payments) || sourceExpense.payments.length === 0
        || sourceExpense.payments.length > MAX_PAYERS_PER_EXPENSE
        || !Array.isArray(sourceExpense.participants) || sourceExpense.participants.length === 0
        || sourceExpense.participants.length > MAX_PARTICIPANTS_PER_EXPENSE
        || !sourceExpense.shares || typeof sourceExpense.shares !== 'object'
        || Array.isArray(sourceExpense.shares)) {
      return { error: 'An expense exceeds payer or participant limits.' };
    }
    if (sourceExpense.payments.some(function(payment) {
      return !hasExactKeys(payment, ['person', 'amount']);
    })) return { error: 'An expense contains an invalid payer entry.' };
    var expense = sanitizeExpense(sourceExpense);
    if (!expense) return { error: 'An expense contains invalid types, money, or split totals.' };
    if (Math.round(calcFinal(expense.base, expense.gst, expense.svc, expense.tip, expense.disc).final * 100)
        !== Math.round(expense.amount * 100)) {
      return { error: 'An expense total does not match its charges and discount.' };
    }
    var payerNames = new Set();
    for (var p = 0; p < expense.payments.length; p++) {
      var payment = expense.payments[p];
      if (!exactPeople.has(payment.person) || payerNames.has(payment.person)) {
        return { error: 'An expense references an unknown or duplicate payer.' };
      }
      payerNames.add(payment.person);
    }
    var participantNames = new Set();
    for (var q = 0; q < expense.participants.length; q++) {
      var participant = expense.participants[q];
      if (!exactPeople.has(participant) || participantNames.has(participant)) {
        return { error: 'An expense references an unknown or duplicate participant.' };
      }
      participantNames.add(participant);
    }
    var shareKeys = Object.keys(sourceExpense.shares);
    if (shareKeys.length !== participantNames.size
        || shareKeys.some(function(key) { return !participantNames.has(key); })) {
      return { error: 'An expense contains unexpected split entries.' };
    }
    var expectedPaidBy = expense.payments.length === 1 ? expense.payments[0].person : null;
    if (expense.paidBy !== expectedPaidBy) return { error: 'An expense has inconsistent payer information.' };
    expenseIds.add(expense.id);
    expenses.push(expense);
  }
  var importedState = { groupName: data.groupName, people: people, archivedPeople: archivedPeople, expenses: expenses };
  if (!hasSafeAggregateAccounting(importedState)) {
    return { error: 'The backup exceeds safe aggregate money limits.' };
  }
  return { state: importedState };
}

function validateBackup(backup) {
  var topKeys = ['app', 'version', 'exportedAt', 'data'];
  if (!hasExactKeys(backup, topKeys) || backup.app !== BACKUP_APP) {
    return { error: 'This is not a Kiska Kitna backup file.' };
  }
  if (backup.version !== BACKUP_VERSION) {
    return { error: 'This backup version is not supported by this app.' };
  }
  if (typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt))) {
    return { error: 'The backup export timestamp is invalid.' };
  }
  var validation = validateImportedGroupData(backup.data, true);
  return validation.error ? validation : { kind: 'current', state: validation.state };
}

function validateCurrentGroupBackup(backup) {
  var topKeys = ['app', 'version', 'type', 'exportedAt', 'data'];
  var groupKeys = ['id', 'groupName', 'people', 'archivedPeople', 'expenses', 'status', 'createdAt', 'updatedAt'];
  if (!hasExactKeys(backup, topKeys)
      || backup.app !== BACKUP_APP || backup.version !== CURRENT_GROUP_BACKUP_VERSION
      || backup.type !== 'current-group' || !validTimestamp(backup.exportedAt)
      || !hasExactKeys(backup.data, groupKeys)) {
    return { error: 'This is not a supported current-group backup.' };
  }
  var validation = validateImportedGroupData({
    groupName: backup.data.groupName,
    people: backup.data.people,
    archivedPeople: backup.data.archivedPeople,
    expenses: backup.data.expenses
  });
  if (validation.error || typeof backup.data.id !== 'string' || !backup.data.id
      || backup.data.id.length > MAX_ID_LENGTH
      || ['active', 'completed', 'archived'].indexOf(backup.data.status) === -1
      || !validTimestamp(backup.data.createdAt) || !validTimestamp(backup.data.updatedAt)) {
    return { error: validation.error || 'The current-group backup contains invalid data.' };
  }
  return {
    kind: 'current',
    state: validation.state,
    metadata: {
      id: backup.data.id,
      status: backup.data.status,
      createdAt: backup.data.createdAt,
      updatedAt: backup.data.updatedAt
    }
  };
}

function validateAllGroupsBackup(backup) {
  var topKeys = ['app', 'version', 'type', 'exportedAt', 'data'];
  if (!hasExactKeys(backup, topKeys)
      || backup.app !== BACKUP_APP || backup.version !== ALL_GROUPS_BACKUP_VERSION
      || backup.type !== 'all-groups') return { error: 'This is not a supported all-groups backup.' };
  if (typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt))
      || !hasExactKeys(backup.data, ['activeGroupId', 'groups'])
      || !Array.isArray(backup.data.groups) || backup.data.groups.length > MAX_GROUPS) {
    return { error: 'The all-groups backup structure is invalid.' };
  }
  var ids = Object.create(null);
  var groups = [];
  for (var i = 0; i < backup.data.groups.length; i++) {
    var value = backup.data.groups[i];
    var groupKeys = ['id', 'groupName', 'people', 'archivedPeople', 'expenses', 'status', 'createdAt', 'updatedAt'];
    if (!hasExactKeys(value, groupKeys) || typeof value.id !== 'string' || !value.id
        || value.id.length > MAX_ID_LENGTH || ids[value.id]
        || ['active', 'completed', 'archived'].indexOf(value.status) === -1
        || !validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt)) {
      return { error: 'The backup contains an invalid or duplicate group.' };
    }
    var groupValidation = validateImportedGroupData({
      groupName: value.groupName,
      people: value.people,
      archivedPeople: value.archivedPeople,
      expenses: value.expenses
    });
    if (groupValidation.error) {
      return { error: groupValidation.error };
    }
    ids[value.id] = true;
    groups.push(createGroupRecord(groupValidation.state, {
      id: value.id,
      status: value.status,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt
    }));
  }
  if (backup.data.activeGroupId !== null && typeof backup.data.activeGroupId !== 'string') {
    return { error: 'The backup has an invalid active group reference.' };
  }
  var activeGroupId = backup.data.activeGroupId && ids[backup.data.activeGroupId]
    ? backup.data.activeGroupId
    : (backup.data.activeGroupId === null || !groups.length ? null : groups[0].id);
  return { kind: 'all', groups: groups, activeGroupId: activeGroupId };
}

function validateImportedBackup(backup) {
  if (backup && backup.version === ALL_GROUPS_BACKUP_VERSION && backup.type === 'all-groups') {
    return validateAllGroupsBackup(backup);
  }
  if (backup && backup.version === CURRENT_GROUP_BACKUP_VERSION && backup.type === 'current-group') {
    return validateCurrentGroupBackup(backup);
  }
  return validateBackup(backup);
}

function importBackupFile(file) {
  if (!file) return;
  if (typeof file.size === 'number' && file.size > MAX_BACKUP_BYTES) {
    setBackupStatus('Backup file is too large. Maximum size is 10 MB.', 'error');
    showToast('Import stopped: backup file is too large.');
    return;
  }
  if (file.type && file.type !== 'application/json' && !/\.json$/i.test(file.name)) {
    setBackupStatus('Please choose a JSON backup file.', 'error');
    return;
  }
  file.text().then(function(text) {
    var textBytes = typeof TextEncoder === 'function'
      ? new TextEncoder().encode(text).byteLength
      : new Blob([text]).size;
    if (textBytes > MAX_BACKUP_BYTES) {
      setBackupStatus('Backup file is too large. Maximum size is 10 MB.', 'error');
      showToast('Import stopped: backup file is too large.');
      return;
    }
    var backup;
    try {
      backup = JSON.parse(text);
    } catch (error) {
      setBackupStatus('That file is not valid JSON.', 'error');
      showToast('Import failed: invalid JSON file.');
      return;
    }
    var validation = validateImportedBackup(backup);
    if (validation.error) {
      setBackupStatus(validation.error, 'error');
      showToast('Import failed: ' + validation.error);
      return;
    }
    var importingCount = validation.kind === 'all' ? validation.groups.length : 1;
    if (groupStore.groups.length + importingCount > MAX_GROUPS) {
      setBackupStatus('Import would exceed the ' + MAX_GROUPS + '-group browser limit.', 'error');
      showToast('Import stopped: too many groups for this browser.');
      return;
    }
    if (validation.kind === 'all') {
      openConfirmation(
        'Import ' + validation.groups.length + (validation.groups.length === 1 ? ' group?' : ' groups?'),
        'Imported groups will be added to Group History. Existing groups will stay unchanged. Matching group IDs will receive new IDs.',
        'Import Groups',
        function() { applyImportedGroups(validation.groups, validation.activeGroupId); }
      );
    } else {
      var importName = validation.state.groupName || 'Untitled Group';
      openConfirmation(
        'Import ' + importName + '?',
        'This backup will be added as a new group. Your existing groups will stay unchanged.',
        'Import Group',
        function() { applyImportedState(validation.state, validation.metadata); }
      );
    }
  }).catch(function() {
    setBackupStatus('The selected file could not be read.', 'error');
    showToast('Import failed: file could not be read.');
  });
}

async function applyImportedState(importedState, metadata) {
  importedState.groupName = importedState.groupName.trim() || 'Untitled Group';
  var importedGroup = createGroupRecord(importedState, metadata);
  if (groupStore.groups.some(function(group) { return group.id === importedGroup.id; })) importedGroup.id = genGroupId();
  if (!await commitStoreMutation(function(proposed) {
    proposed.groups.push(importedGroup);
    proposed.activeGroupId = importedGroup.id;
  })) return;
  modalSt = { editingId: null, splitType: 'equal', payerMode: 'single', people: [] };
  openGroup(importedGroup.id);
  var label = state.groupName ? ' "' + state.groupName + '"' : '';
  setBackupStatus('Backup added successfully' + label + '.', 'success');
  showToast('Group imported' + label + '.');
}

async function applyImportedGroups(importedGroups, importedActiveGroupId) {
  if (!await commitStoreMutation(function(proposed) {
    var existingIds = Object.create(null);
    var mappedIds = Object.create(null);
    proposed.groups.forEach(function(group) { existingIds[group.id] = true; });
    var hasCurrentActive = proposed.groups.some(function(group) {
      return group.id === proposed.activeGroupId;
    });
    var copies = importedGroups.map(function(group) {
      var sourceId = group.id;
      var copy = JSON.parse(JSON.stringify(group));
      while (existingIds[copy.id]) copy.id = genGroupId();
      existingIds[copy.id] = true;
      mappedIds[sourceId] = copy.id;
      return copy;
    });
    proposed.groups = proposed.groups.concat(copies);
    if (!hasCurrentActive && importedActiveGroupId && mappedIds[importedActiveGroupId]) {
      proposed.activeGroupId = mappedIds[importedActiveGroupId];
    }
  })) return;
  showDashboard();
  setBackupStatus(importedGroups.length + (importedGroups.length === 1 ? ' group added.' : ' groups added.'), 'success');
  showToast('Group History imported. Existing groups were kept.');
}

elExportBackup.addEventListener('click', exportBackup);
elExportAllBackup.addEventListener('click', exportAllGroupsBackup);
elImportBackup.addEventListener('click', function() { elImportFile.click(); });
elDashboardImport.addEventListener('click', function() { elImportFile.click(); });
elDashboardExportAll.addEventListener('click', exportAllGroupsBackup);
elImportFile.addEventListener('change', function() {
  var file = elImportFile.files && elImportFile.files[0];
  elImportFile.value = '';
  importBackupFile(file);
});

// Hero
elStart.addEventListener('click', function() {
  elApp.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Group name
elGroup.addEventListener('input', async function() {
  var name = elGroup.value.trim();
  if (name) {
    if (!await commitActiveGroupMutation(function(group) { group.groupName = name; })) {
      elGroup.value = state.groupName;
      return;
    }
    elActiveGroupName.textContent = state.groupName;
    if (!elGroupDashboard.hidden) renderGroupDashboard();
  }
});
elGroup.addEventListener('blur', function() {
  if (!elGroup.value.trim()) {
    elGroup.value = state.groupName;
    showToast('Group name cannot be empty.');
  }
});

// Charges toggle
elChargesToggle.addEventListener('click', function() {
  var open = !elChargesSec.hidden;
  elChargesSec.hidden = open;
  elChargesToggle.textContent = open ? '+ 6. Add optional charges' : '\u2212 6. Optional charges';
  elChargesToggle.setAttribute('aria-expanded', String(!open));
});
[elGst, elSvc, elTip, elDisc].forEach(function(el) {
  el.addEventListener('input', function() { el.dataset.touched = 'true'; updateBreakdown(); refreshShares(); refreshSaveBtn(); });
  el.addEventListener('blur', function() { el.dataset.touched = 'true'; refreshSaveBtn(); });
});

// People
elAddP.addEventListener('click', addPerson);
elPName.addEventListener('keydown', function(e) { if (e.key === 'Enter') addPerson(); });

async function addPerson() {
  if (state.status && state.status !== 'active') { showToast('Restore this group to edit it.'); return; }
  var name = elPName.value.trim();
  if (!name) { showPersonError('Naam toh daalo!'); return; }
  if (isUnsafeUserKey(name)) { showPersonError('Please use a different name.'); return; }
  for (var i = 0; i < state.people.length; i++) {
    if (state.people[i].toLowerCase() === name.toLowerCase()) {
      showPersonError('"' + name + '" already hai!'); return;
    }
  }
  var archivedIndex = (state.archivedPeople || []).findIndex(function(p) {
    return p.toLowerCase() === name.toLowerCase();
  });
  if (archivedIndex !== -1) {
    var restoredName = state.archivedPeople[archivedIndex];
    if (!await commitActiveGroupMutation(function(group) {
      group.archivedPeople.splice(archivedIndex, 1);
      group.people.push(restoredName);
    })) return;
    elPName.value = '';
    elPErr.textContent = '';
    elPName.setAttribute('aria-invalid', 'false');
    renderPeople();
    refreshExpBtn();
    showToast(restoredName + ' current group mein wapas aa gaye.');
    return;
  }
  if (!await commitActiveGroupMutation(function(group) { group.people.push(name); })) return;
  elPName.value = '';
  elPErr.textContent = '';
  elPName.setAttribute('aria-invalid', 'false');
  elPName.setAttribute('aria-invalid', 'false');
  renderPeople();
  refreshExpBtn();
  elPName.focus();
}

function showPersonError(message) {
  elPErr.textContent = message;
  elPName.setAttribute('aria-invalid', 'true');
  elPName.focus();
}

function removePerson(name) {
  if (state.status && state.status !== 'active') { showToast('Restore this group to edit it.'); return; }
  var references = state.expenses.filter(function(exp) {
    return expensePeople(exp).indexOf(name) !== -1;
  });
  if (references.length === 0) {
    finalizePersonRemoval(name, false);
    return;
  }
  openConfirmation(
    'Remove ' + name + ' from this group?',
    name + ' is used in ' + references.length + ' existing expense' + (references.length === 1 ? '' : 's')
      + '. Their historical payments, shares and settlement will stay unchanged, but they will not appear in new expenses.',
    'Remove person',
    function() { finalizePersonRemoval(name, true); }
  );
}

async function finalizePersonRemoval(name, keepHistorical) {
  if (!await commitActiveGroupMutation(function(group) {
    group.people = group.people.filter(function(p) { return p !== name; });
    if (keepHistorical && group.archivedPeople.indexOf(name) === -1) group.archivedPeople.push(name);
  })) return;
  renderPeople();
  refreshExpBtn();
  renderSettlement();
  elPName.focus();
  showToast(keepHistorical ? name + ' removed. History preserved.' : name + ' removed.');
}

function expensePeople(exp) {
  var people = [];
  function add(name) { if (name && people.indexOf(name) === -1) people.push(name); }
  (exp.payments || []).forEach(function(payment) { add(payment.person); });
  add(exp.paidBy);
  (exp.participants || []).forEach(add);
  Object.keys(exp.shares || {}).forEach(add);
  return people;
}

function pruneArchivedPeople(group) {
  var target = group || state;
  target.archivedPeople = (target.archivedPeople || []).filter(function(person) {
    return target.expenses.some(function(exp) { return expensePeople(exp).indexOf(person) !== -1; });
  });
}

function settlementPeople(result) {
  var people = [];
  function add(name) { if (name && people.indexOf(name) === -1) people.push(name); }
  state.people.forEach(add);
  (state.archivedPeople || []).forEach(add);
  Object.keys(result.balances || {}).forEach(add);
  return people;
}

function renderPeople() {
  Array.from(elPList.children).forEach(function(c) { if (c.id !== 'peopleEmptyState') c.remove(); });
  var archived = state.archivedPeople || [];
  elPastMembers.hidden = archived.length === 0;
  elPastMembers.innerHTML = archived.length === 0 ? ''
    : '<strong>Past members</strong><span>Kept in historical expenses: ' + archived.map(esc).join(', ') + '</span>';
  if (state.people.length === 0) { elPEmpty.hidden = false; return; }
  elPEmpty.hidden = true;
  state.people.forEach(function(name) {
    var li = document.createElement('li');
    li.className = 'person-item';
    li.innerHTML = '<span class="person-item__name">&#128100; ' + esc(name) + '</span>'
      + (state.status === 'active' ? '<button class="btn btn--ghost" aria-label="Remove ' + esc(name) + '">&#10005; Remove</button>' : '');
    var removeButton = li.querySelector('button');
    if (removeButton) removeButton.addEventListener('click', function() { removePerson(name); });
    elPList.appendChild(li);
  });
}

function refreshExpBtn() {
  elAddExp.disabled = state.status !== 'active' || state.people.length < 2;
  if (state.people.length < 2) {
    elExpEmpty.querySelector('p').textContent = 'Pehle 2 log add karo!';
  } else if (state.expenses.length === 0) {
    elExpEmpty.querySelector('p').textContent = 'Koi expense nahi - Add Expense dabao!';
  }
}

// Expense modal
elAddExp.addEventListener('click', function() { openModal(null); });

function openModal(editId) {
  if (state.status && state.status !== 'active') { showToast('Restore this group to edit expenses.'); return; }
  var editingExpense = editId ? state.expenses.find(function(exp) { return exp.id === editId; }) : null;
  if (!editingExpense && state.people.length < 2) { showToast('Pehle 2 log add karo!'); return; }
  modalReturnFocus = document.activeElement;
  modalSt.editingId = editId;
  modalSt.splitType = 'equal';
  modalSt.people = state.people.slice();
  if (editingExpense) {
    expensePeople(editingExpense).forEach(function(person) {
      if (modalSt.people.indexOf(person) === -1) modalSt.people.push(person);
    });
  }
  elMTitle.textContent = editId ? 'Edit Expense' : 'Add Expense';

  elPaidBy.innerHTML = modalSt.people.map(function(p) {
    var isPast = state.people.indexOf(p) === -1;
    return '<option value="' + esc(p) + '">' + esc(p) + (isPast ? ' (past member)' : '') + '</option>';
  }).join('');
  renderPayerChoices(elPaidBy.value);

  elPBoxes.innerHTML = '';
  modalSt.people.forEach(function(p) {
    var lbl = document.createElement('label');
    lbl.className = 'checkbox-item';
    lbl.innerHTML = '<input type="checkbox" value="' + esc(p) + '" checked>'
      + '<span class="checkbox-item__name">' + esc(p)
      + (state.people.indexOf(p) === -1 ? '<small>Past member</small>' : '') + '</span>';
    lbl.querySelector('input').addEventListener('change', onChkChange);
    elPBoxes.appendChild(lbl);
  });
  elSelAll.textContent = 'Deselect all';

  setTab('equal');
  elExpName.value = '';
  elExpAmt.value = '';
  elGst.value  = '0';
  elSvc.value  = '0';
  elTip.value  = '0';
  elDisc.value = '0';
  elChargesSec.hidden = true;
  elChargesToggle.textContent = '+ 6. Add optional charges';
  elChargesToggle.setAttribute('aria-expanded', 'false');
  elBdBox.hidden = true;
  elExpErr.textContent = '';
  elExpNameErr.textContent = '';
  elExpAmtErr.textContent = '';
  elParticipantErr.textContent = '';
  elChargeErr.textContent = '';
  [elExpName, elExpAmt, elGst, elSvc, elTip, elDisc].forEach(function(el) {
    delete el.dataset.touched;
    el.setAttribute('aria-invalid', 'false');
  });
  // Reset payer to single mode
  modalSt.payerMode = 'single';
  elSinglePayerSec.hidden = false;
  elMultiPayerSec.hidden  = true;
  elSwitchConfirm.hidden  = true;
  elPayerTotalDisp.textContent = '';
  elPayerTotalDisp.className   = 'payer-total';
  elPayerErr.textContent = '';

  if (editingExpense) fillModal(editingExpense);

  refreshShares();
  refreshExpenseReview();
  refreshSaveBtn();
  elMOv.hidden = false;
  elMOv.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(function() { elExpName.focus(); }, 80);
}

function fillModal(exp) {
  elExpName.value = exp.name;
  elExpAmt.value  = exp.base || exp.amount;  // base field (backward compat)
  elPaidBy.value  = exp.paidBy;
  elGst.value  = exp.gst  || 0;
  elSvc.value  = exp.svc  || 0;
  elTip.value  = exp.tip  || 0;
  elDisc.value = exp.disc || 0;
  // Auto-open charges section if any charge was saved
  if ((exp.gst||0) + (exp.svc||0) + (exp.tip||0) + (exp.disc||0) > 0) {
    elChargesSec.hidden = false;
    elChargesToggle.textContent = '\u2212 6. Optional charges';
    elChargesToggle.setAttribute('aria-expanded', 'true');
  }
  updateBreakdown();
  // Restore payer info (backward compat: old expenses have paidBy, new have payments)
  if (exp.payments && exp.payments.length > 1) {
    setPayerMode('multi');
    renderPayerInputs(exp.payments);
  } else if (exp.payments && exp.payments.length === 1) {
    setPayerMode('single');
    elPaidBy.value = exp.payments[0].person;
    selectPayer(exp.payments[0].person);
  } else {
    setPayerMode('single');
    elPaidBy.value = exp.paidBy || '';
    selectPayer(exp.paidBy || '');
  }
  elPBoxes.querySelectorAll('input[type="checkbox"]').forEach(function(chk) {
    chk.checked = exp.participants.indexOf(chk.value) !== -1;
  });
  setTab(exp.splitType);
  if (exp.splitType === 'custom') {
    elSharesDis.querySelectorAll('.share-input').forEach(function(inp) {
      inp.value = exp.shares[inp.dataset.person] || '';
    });
    refreshSaveBtn();
  }
}

function closeModal() {
  elMOv.hidden = true;
  elMOv.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  modalSt.editingId = null;
  restoreDialogFocus(modalReturnFocus, elAddExp);
}
window.closeModal = closeModal;

function openConfirmation(title, message, actionLabel, action) {
  confirmReturnFocus = document.activeElement;
  confirmAction = action;
  elConfirmTitle.textContent = title;
  elConfirmMessage.textContent = message;
  elConfirmAction.textContent = actionLabel;
  elConfirmOverlay.hidden = false;
  elConfirmOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  elConfirmCancel.focus();
}

function closeConfirmation(restoreFocus) {
  elConfirmOverlay.hidden = true;
  elConfirmOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  confirmAction = null;
  if (restoreFocus !== false) restoreDialogFocus(confirmReturnFocus, elAllGroups);
}

elConfirmCancel.addEventListener('click', closeConfirmation);
elConfirmAction.addEventListener('click', function() {
  var action = confirmAction;
  var returnTarget = confirmReturnFocus;
  closeConfirmation(false);
  if (action) action();
  if (!document.contains(document.activeElement)
      || document.activeElement === document.body
      || elConfirmOverlay.contains(document.activeElement)) {
    restoreDialogFocus(returnTarget, elAllGroups);
  }
});
elConfirmOverlay.addEventListener('click', function(event) {
  if (event.target === elConfirmOverlay) closeConfirmation();
});

elResetGroup.addEventListener('click', function() {
  var group = activeGroup();
  if (!group) return;
  openConfirmation(
    'Clear contents of ' + group.groupName + '?',
    'This permanently removes this group\'s people and expenses but keeps the empty group in Group History. Archive keeps data instead.',
    'Clear Contents',
    resetGroup
  );
});

async function resetGroup() {
  var group = activeGroup();
  if (!group) return;
  if (!await commitActiveGroupMutation(function(proposedGroup) {
    proposedGroup.people = [];
    proposedGroup.archivedPeople = [];
    proposedGroup.expenses = [];
  })) return;
  modalSt = { editingId: null, splitType: 'equal', payerMode: 'single', people: [] };
  elPName.value = '';
  elPErr.textContent = '';
  renderPeople();
  renderExpenses();
  refreshExpBtn();
  showToast('Group cleared.');
}

elMOv.addEventListener('click', function(e) { if (e.target === elMOv) closeModal(); });
document.addEventListener('keydown', function(e) {
  var dialog = activeDialog();
  if (!dialog) return;
  if (e.key === 'Tab') trapDialogFocus(e, dialog);
  if (e.key !== 'Escape') return;
  if (!elGroupEditor.hidden) closeGroupEditor();
  else if (!elConfirmOverlay.hidden) closeConfirmation();
  else closeModal();
});

document.addEventListener('focusin', function(event) {
  var dialog = activeDialog();
  if (!dialog || dialog.contains(event.target)) return;
  var focusable = dialogFocusableElements(dialog);
  (focusable[0] || dialog).focus();
});

function activeDialog() {
  if (!elConfirmOverlay.hidden) return elConfirmOverlay.querySelector('[role="alertdialog"]');
  if (!elGroupEditor.hidden) return elGroupEditor.querySelector('[role="dialog"]');
  if (!elMOv.hidden) return document.getElementById('expenseModal');
  return null;
}

function dialogFocusableElements(dialog) {
  return Array.from(dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(function(element) {
    return !element.hidden && element.getClientRects().length > 0;
  });
}

function trapDialogFocus(event, dialog) {
  var focusable = dialogFocusableElements(dialog);
  if (focusable.length === 0) { event.preventDefault(); dialog.focus(); return; }
  var first = focusable[0];
  var last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
}

function restoreDialogFocus(target, fallback) {
  var candidates = [target, fallback, elPName, elAddExp, elAllGroups, elNewGroup, elEmptyNewGroup];
  var next = candidates.find(function(element) {
    return element && document.contains(element) && !element.disabled && element.getClientRects().length
      && element.matches('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  });
  if (next) next.focus();
}

elTabs.addEventListener('click', function(e) {
  var tab = e.target.closest('.split-tab');
  if (!tab) return;
  setTab(tab.dataset.type);
  refreshShares();
  refreshSaveBtn();
});

function setTab(type) {
  modalSt.splitType = type;
  elTabs.querySelectorAll('.split-tab').forEach(function(t) {
    t.classList.toggle('split-tab--active', t.dataset.type === type);
    t.setAttribute('aria-pressed', String(t.dataset.type === type));
  });
}

elSelAll.addEventListener('click', function() {
  var cbs = elPBoxes.querySelectorAll('input[type="checkbox"]');
  var allOn = Array.from(cbs).every(function(c) { return c.checked; });
  cbs.forEach(function(c) { c.checked = !allOn; });
  elSelAll.textContent = allOn ? 'Everyone' : 'Deselect all';
  refreshShares();
  refreshSaveBtn();
});

function onChkChange() {
  var allOn = Array.from(elPBoxes.querySelectorAll('input[type="checkbox"]')).every(function(c) { return c.checked; });
  elSelAll.textContent = allOn ? 'Deselect all' : 'Everyone';
  refreshShares();
  refreshSaveBtn();
}

elExpName.addEventListener('input', refreshSaveBtn);
elExpName.addEventListener('blur', function() { elExpName.dataset.touched = 'true'; refreshSaveBtn(); });
elExpAmt.addEventListener('input', function() {
  updateBreakdown(); refreshShares();
  if (modalSt.payerMode === 'multi') refreshPayerTotal();
  refreshSaveBtn();
});
elExpAmt.addEventListener('blur', function() { elExpAmt.dataset.touched = 'true'; refreshSaveBtn(); });

// Payer mode tabs
elPayerModeTabs.addEventListener('click', function(e) {
  var tab = e.target.closest('.payer-tab');
  if (!tab) return;
  var newMode = tab.dataset.mode;
  if (newMode === modalSt.payerMode) return;
  if (modalSt.payerMode === 'multi' && getPayTotal() > 0) {
    elSwitchConfirm.dataset.pendingMode = newMode;
    elSwitchConfirm.hidden = false;
    return;
  }
  setPayerMode(newMode);
});
elSwitchYes.addEventListener('click', function() {
  elSwitchConfirm.hidden = true;
  setPayerMode(elSwitchConfirm.dataset.pendingMode || 'single');
});
elSwitchNo.addEventListener('click', function() { elSwitchConfirm.hidden = true; });

elSplitPayBtn.addEventListener('click', function() {
  var finalAmt = getFinalAmt();
  if (finalAmt <= 0 || modalSt.people.length === 0) return;
  var sh = equalSplit(finalAmt, modalSt.people);
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(inp) {
    inp.value = sh[inp.dataset.person] || 0;
  });
  refreshPayerTotal();
});
elClearPayBtn.addEventListener('click', function() {
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(inp) { inp.value = 0; });
  refreshPayerTotal();
});

// Charge calculation helpers
function calcFinal(base, gstPct, svcPct, tipAmt, discAmt) {
  var bp = Math.round(base * 100);
  var gp = Math.round(base * (gstPct / 100) * 100);
  var sp = Math.round(base * (svcPct / 100) * 100);
  var tp = Math.round(tipAmt * 100);
  var dp = Math.round(discAmt * 100);
  var fp = Math.max(0, bp + gp + sp + tp - dp);
  return { base: bp/100, gst: gp/100, svc: sp/100, tip: tp/100, disc: dp/100, final: fp/100 };
}

function getFinalAmt() {
  var base = validInputNumber(elExpAmt, false) ? parseFloat(elExpAmt.value) : 0;
  return calcFinal(base,
    validInputNumber(elGst, true, 100) ? parseFloat(elGst.value) || 0 : 0,
    validInputNumber(elSvc, true, 100) ? parseFloat(elSvc.value) || 0 : 0,
    validInputNumber(elTip, true) ? parseFloat(elTip.value) || 0 : 0,
    validInputNumber(elDisc, true) ? parseFloat(elDisc.value) || 0 : 0
  ).final;
}

function validInputNumber(input, allowZero, maximum) {
  var raw = input.value.trim();
  if (raw === '') return allowZero;
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return false;
  var value = Number(raw);
  var max = maximum === undefined ? MAX_EXPENSE_AMOUNT : maximum;
  return Number.isFinite(value) && value <= max && (allowZero ? value >= 0 : value > 0);
}

function inputPaise(input) {
  return validInputNumber(input, true) ? Math.round(Number(input.value || 0) * 100) : null;
}

function updateBreakdown() {
  var base = validInputNumber(elExpAmt, false) ? parseFloat(elExpAmt.value) : 0;
  if (base <= 0) { elBdBox.hidden = true; return; }
  var f = calcFinal(base,
    parseFloat(elGst.value)  || 0,
    parseFloat(elSvc.value)  || 0,
    parseFloat(elTip.value)  || 0,
    parseFloat(elDisc.value) || 0
  );
  var hasCharges = f.gst > 0 || f.svc > 0 || f.tip > 0 || f.disc > 0;
  elBdBox.hidden = !hasCharges;
  if (!hasCharges) return;
  elBdBase.textContent = rupees(f.base);
  elBdGstRow.hidden = f.gst === 0;
  if (f.gst > 0) { elBdGstLbl.textContent = 'GST (' + (parseFloat(elGst.value)||0) + '%)'; elBdGst.textContent = '+' + rupees(f.gst); }
  elBdSvcRow.hidden = f.svc === 0;
  if (f.svc > 0) { elBdSvc.textContent = '+' + rupees(f.svc); }
  elBdTipRow.hidden = f.tip === 0;
  if (f.tip > 0) { elBdTip.textContent = '+' + rupees(f.tip); }
  elBdDiscRow.hidden = f.disc === 0;
  if (f.disc > 0) { elBdDisc.textContent = '\u2212' + rupees(f.disc); }
  elBdFinal.textContent = rupees(f.final);
}

// Payer mode functions
function setPayerMode(mode) {
  modalSt.payerMode = mode;
  elPayerModeTabs.querySelectorAll('.payer-tab').forEach(function(t) {
    t.classList.toggle('payer-tab--active', t.dataset.mode === mode);
    t.setAttribute('aria-pressed', String(t.dataset.mode === mode));
  });
  elSinglePayerSec.hidden = (mode !== 'single');
  elMultiPayerSec.hidden  = (mode !== 'multi');
  elSwitchConfirm.hidden  = true;
  if (mode === 'multi') renderPayerInputs();
  refreshSaveBtn();
}

function renderPayerChoices(selectedPerson) {
  elPayerChoiceList.innerHTML = modalSt.people.map(function(person, index) {
    var selected = person === selectedPerson || (!selectedPerson && index === 0);
    return '<label class="payer-choice"><input type="radio" name="expensePayer" value="' + esc(person) + '"'
      + (selected ? ' checked' : '') + '><span>' + esc(person) + '</span></label>';
  }).join('');
  elPayerChoiceList.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('change', function() { selectPayer(input.value); refreshSaveBtn(); });
  });
}

function selectPayer(person) {
  if (!person || modalSt.people.indexOf(person) === -1) return;
  elPaidBy.value = person;
  elPayerChoiceList.querySelectorAll('input').forEach(function(input) {
    input.checked = input.value === person;
  });
}

function renderPayerInputs(existingPayments) {
  var payMap = Object.create(null);
  if (existingPayments) {
    existingPayments.forEach(function(pm) { payMap[pm.person] = pm.amount; });
  }
  elPayerInputsList.innerHTML = modalSt.people.map(function(p) {
    var val = payMap[p] !== undefined ? payMap[p] : 0;
    return '<div class="payer-input-row">'
      + '<span class="payer-input-name">&#128100; ' + esc(p) + '</span>'
      + '<div class="input-prefix-wrap" style="width:110px;flex-shrink:0">'
      + '<span class="input-prefix" style="padding:7px 8px 7px 10px;font-size:.9rem">&#8377;</span>'
      + '<input class="input input--prefixed payer-amt-input" data-person="' + esc(p) + '"'
      + ' aria-label="Amount paid by ' + esc(p) + '" aria-describedby="payerError"'
      + ' type="number" min="0" max="' + MAX_EXPENSE_AMOUNT + '" step="0.01" inputmode="decimal" placeholder="0.00"'
      + ' value="' + val + '"'
      + ' style="padding:7px 8px;font-size:.9rem;width:70px">'
      + '</div></div>';
  }).join('');
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(inp) {
    inp.addEventListener('input', refreshPayerTotal);
  });
  refreshPayerTotal();
}

function getPayTotal() {
  return getPayTotalPaise() / 100;
}

function getPayTotalPaise() {
  var totalPaise = 0;
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(inp) {
    var paise = inputPaise(inp);
    if (paise !== null) totalPaise += paise;
  });
  return totalPaise;
}

function refreshPayerTotal() {
  var total    = getPayTotal();
  var finalAmt = getFinalAmt();
  var inputsValid = multiPaymentInputsValid();
  var ok = inputsValid && finalAmt > 0 && getPayTotalPaise() === Math.round(finalAmt * 100);
  elPayerTotalDisp.textContent = 'Total paid: ' + rupees(total) + (ok ? ' \u2705' : '');
  elPayerTotalDisp.className   = 'payer-total' + (ok ? ' payer-total--ok' : (finalAmt > 0 ? ' payer-total--err' : ''));
  elPayerErr.textContent = !inputsValid ? 'Amount must be entered up to 2 decimal places.'
    : ((!ok && finalAmt > 0 && total > 0) ? rupees(finalAmt) + ' hona chahiye \u2014 abhi ' + rupees(total) + ' dala hai.' : '');
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(input) {
    input.setAttribute('aria-invalid', String(!validInputNumber(input, true)));
  });
  refreshSaveBtn();
}

function getMultiPayments() {
  var payments = [];
  elPayerInputsList.querySelectorAll('.payer-amt-input').forEach(function(inp) {
    var paise = inputPaise(inp);
    if (paise > 0) payments.push({ person: inp.dataset.person, amount: paise / 100 });
  });
  return payments;
}

function multiPaymentInputsValid() {
  return Array.from(elPayerInputsList.querySelectorAll('.payer-amt-input')).every(function(input) {
    return validInputNumber(input, true);
  });
}

function refreshShares() {
  var people = checkedPeople();
  var amount = getFinalAmt();
  if (people.length === 0 || amount <= 0) {
    elSharesSec.hidden = true; elSharesDis.innerHTML = ''; elSplitProgress.textContent = '';
    refreshExpenseReview(); return;
  }
  elSharesSec.hidden = false;

  if (modalSt.splitType === 'equal') {
    elSharesLabel.textContent = 'Equal shares';
    var sh = equalSplit(amount, people);
    elSharesDis.innerHTML = people.map(function(p) {
      return '<div class="share-row"><span class="share-row__name">&#128100; ' + esc(p) + '</span>'
        + '<span class="share-row__amount">' + rupees(sh[p]) + '</span></div>';
    }).join('');
    elSplitProgress.textContent = 'Total ' + rupees(amount) + ' · fully assigned';
    elSplitProgress.className = 'split-progress split-progress--ok';
  } else {
    elSharesLabel.textContent = 'Exact amounts';
    var prev = Object.create(null);
    elSharesDis.querySelectorAll('.share-input').forEach(function(inp) { prev[inp.dataset.person] = inp.value; });
    elSharesDis.innerHTML = people.map(function(p) {
      return '<div class="share-row"><span class="share-row__name">&#128100; ' + esc(p) + '</span>'
        + '<div class="input-prefix-wrap" style="width:110px;flex-shrink:0">'
        + '<span class="input-prefix" style="padding:7px 8px 7px 10px;font-size:.9rem">&#8377;</span>'
        + '<input class="input input--prefixed share-input" data-person="' + esc(p) + '"'
        + ' aria-label="Exact share amount for ' + esc(p) + '" aria-describedby="expenseError splitProgress"'
        + ' type="number" min="0" max="' + MAX_EXPENSE_AMOUNT + '" step="0.01" inputmode="decimal" placeholder="0.00"'
        + ' value="' + (prev[p] || '') + '"'
        + ' style="padding:7px 8px;font-size:.9rem;width:70px"></div></div>';
    }).join('');
    elSharesDis.querySelectorAll('.share-input').forEach(function(inp) {
      inp.addEventListener('input', refreshSaveBtn);
    });
  }
  refreshExpenseReview();
}

function refreshSaveBtn() {
  var name = elExpName.value.trim();
  var baseValid = validInputNumber(elExpAmt, false);
  var amount = getFinalAmt();
  var people = checkedPeople();
  var chargesValid = validateChargeInputs();
  elExpNameErr.textContent = !name && elExpName.dataset.touched ? 'Add a short description.' : '';
  elExpAmtErr.textContent = !baseValid && elExpAmt.dataset.touched
    ? (elExpAmt.value.trim() && !/^\d+(?:\.\d{0,2})?$/.test(elExpAmt.value.trim())
      ? 'Amount must be entered up to 2 decimal places.'
      : (elExpAmt.value.trim() ? 'Enter a valid amount up to ' + rupees(MAX_EXPENSE_AMOUNT) + '.' : 'Enter the expense amount.')) : '';
  elParticipantErr.textContent = people.length === 0 ? 'Select at least one participant.' : '';
  elPBoxes.setAttribute('aria-invalid', String(people.length === 0));
  elExpName.setAttribute('aria-invalid', String(!name && Boolean(elExpName.dataset.touched)));
  elExpAmt.setAttribute('aria-invalid', String(!baseValid && Boolean(elExpAmt.dataset.touched)));
  updateParticipantSummary(people, amount);
  updateSplitProgress(amount);
  refreshExpenseReview();
  if (!name || !baseValid || !chargesValid || amount <= 0 || people.length === 0) {
    elMSave.disabled = true; elExpErr.textContent = ''; return;
  }
  // Validate payments in multi mode
  if (modalSt.payerMode === 'multi') {
    if (!multiPaymentInputsValid() || getPayTotalPaise() !== Math.round(amount * 100)) { elMSave.disabled = true; return; }
  }
  if (modalSt.splitType === 'custom') {
    var total = customTotal();
    if (!customInputsValid() || customTotalPaise() !== Math.round(amount * 100)) {
      elExpErr.textContent = !customInputsValid() ? 'Amount must be entered up to 2 decimal places.'
        : 'Split total ' + rupees(total) + ' \u2014 ' + rupees(amount) + ' hona chahiye.';
      elSharesDis.querySelectorAll('.share-input').forEach(function(input) {
        input.setAttribute('aria-invalid', String(!validInputNumber(input, true)));
      });
      elMSave.disabled = true; return;
    }
  }
  elSharesDis.querySelectorAll('.share-input').forEach(function(input) {
    input.setAttribute('aria-invalid', 'false');
  });
  elExpErr.textContent = '';
  elMSave.disabled = false;
}

function validateChargeInputs() {
  var gstValid = validInputNumber(elGst, true, 100);
  var svcValid = validInputNumber(elSvc, true, 100);
  var tipValid = validInputNumber(elTip, true);
  var discValid = validInputNumber(elDisc, true);
  var base = validInputNumber(elExpAmt, false) ? Number(elExpAmt.value) : 0;
  var gst = gstValid ? Number(elGst.value) || 0 : 0;
  var svc = svcValid ? Number(elSvc.value) || 0 : 0;
  var tip = tipValid ? Number(elTip.value) || 0 : 0;
  var discount = discValid ? Number(elDisc.value) || 0 : 0;
  var discountValid = !base || discount < base + base * gst / 100 + base * svc / 100 + tip;
  var showError = [elGst, elSvc, elTip, elDisc].some(function(el) { return el.dataset.touched; });
  var precisionInvalid = [elGst, elSvc, elTip, elDisc].some(function(input) {
    return input.value.trim() && !/^\d+(?:\.\d{0,2})?$/.test(input.value.trim());
  });
  elChargeErr.textContent = showError && precisionInvalid
    ? 'Amount must be entered up to 2 decimal places.'
    : (showError && (!gstValid || !svcValid || !tipValid || !discValid)
      ? 'Use 0–100% for rates and non-negative amounts for tip and discount.'
      : (showError && !discountValid ? 'Discount must be less than the amount before discount.' : ''));
  elGst.setAttribute('aria-invalid', String(showError && !gstValid));
  elSvc.setAttribute('aria-invalid', String(showError && !svcValid));
  elTip.setAttribute('aria-invalid', String(showError && !tipValid));
  elDisc.setAttribute('aria-invalid', String(showError && (!discValid || !discountValid)));
  return gstValid && svcValid && tipValid && discValid && discountValid;
}

function customInputsValid() {
  return Array.from(elSharesDis.querySelectorAll('.share-input')).every(function(input) {
    return validInputNumber(input, true);
  });
}

function updateParticipantSummary(people, amount) {
  if (people.length === 0) {
    elParticipantSummary.textContent = 'No one selected';
    return;
  }
  elParticipantSummary.textContent = people.length + (people.length === 1 ? ' person' : ' people')
    + (amount > 0 && modalSt.splitType === 'equal' ? ' · ' + rupees(amount) + ' ÷ ' + people.length : ' selected');
}

function updateSplitProgress(amount) {
  if (modalSt.splitType !== 'custom' || amount <= 0 || checkedPeople().length === 0) return;
  var assignedPaise = customTotalPaise();
  var remainingPaise = Math.round(amount * 100) - assignedPaise;
  var assigned = assignedPaise / 100;
  var remaining = remainingPaise / 100;
  elSplitProgress.innerHTML = '<span>Total: ' + rupees(amount) + '</span><span>Assigned: ' + rupees(assigned)
    + '</span><strong>Remaining: ' + rupees(remaining) + '</strong>';
  elSplitProgress.className = 'split-progress' + (remainingPaise === 0 && customInputsValid() ? ' split-progress--ok' : ' split-progress--pending');
}

function refreshExpenseReview() {
  var amount = getFinalAmt();
  var people = checkedPeople();
  elReviewName.textContent = elExpName.value.trim() || 'New expense';
  elReviewAmount.textContent = rupees(amount);
  if (modalSt.payerMode === 'single') {
    elReviewPayer.textContent = elPaidBy.value ? 'Paid by ' + elPaidBy.value : 'Choose who paid';
  } else {
    var payers = getMultiPayments();
    elReviewPayer.textContent = payers.length ? 'Paid by ' + payers.length + (payers.length === 1 ? ' person' : ' people') : 'Add payer amounts';
  }
  if (!people.length) {
    elReviewSplit.textContent = 'Choose participants to see the split';
  } else if (modalSt.splitType === 'equal' && amount > 0) {
    var shares = equalSplit(amount, people);
    var values = people.map(function(person) { return shares[person]; });
    var sameShare = values.every(function(value) { return value === values[0]; });
    elReviewSplit.textContent = 'Shared by ' + people.length + (people.length === 1 ? ' person' : ' people')
      + (sameShare ? ' · ' + rupees(values[0]) + ' each' : ' · rounded to the nearest paise');
  } else {
    elReviewSplit.textContent = 'Exact split · ' + rupees(customTotal()) + ' assigned';
  }
}

elMSave.addEventListener('click', saveExpense);

async function saveExpense() {
  if (state.status && state.status !== 'active') { showToast('Restore this group to edit expenses.'); closeModal(); return; }
  refreshSaveBtn();
  if (elMSave.disabled) return;
  var name  = elExpName.value.trim();
  var base  = Math.round(parseFloat(elExpAmt.value) * 100) / 100;
  var gst   = parseFloat(elGst.value)  || 0;
  var svc   = parseFloat(elSvc.value)  || 0;
  var tip   = Math.round((parseFloat(elTip.value)  || 0) * 100) / 100;
  var disc  = Math.round((parseFloat(elDisc.value) || 0) * 100) / 100;
  var calc  = calcFinal(base, gst, svc, tip, disc);
  var people = checkedPeople();
  var shares = modalSt.splitType === 'equal' ? equalSplit(calc.final, people) : getCustomShares();
  // Build payments array
  var payments, paidBy;
  if (modalSt.payerMode === 'single') {
    paidBy   = elPaidBy.value;
    payments = [{ person: paidBy, amount: calc.final }];
  } else {
    payments = getMultiPayments();
    paidBy   = payments.length === 1 ? payments[0].person : null;
  }
  var expObj = { id: modalSt.editingId || genId(),
    name: name, base: base, gst: gst, svc: svc, tip: tip, disc: disc,
    amount: calc.final, paidBy: paidBy, payments: payments,
    splitType: modalSt.splitType, participants: people, shares: shares };
  var expenseError = validateExpenseForSave(expObj, modalSt.people);
  if (expenseError) {
    elExpErr.textContent = expenseError;
    elMSave.disabled = true;
    return;
  }
  if (modalSt.editingId) {
    var idx = state.expenses.findIndex(function(e) { return e.id === modalSt.editingId; });
    if (idx === -1) {
      elExpErr.textContent = 'This expense is no longer available. Close and try again.';
      return;
    }
    if (!await commitActiveGroupMutation(function(group) {
      var proposedIndex = group.expenses.findIndex(function(expense) { return expense.id === modalSt.editingId; });
      if (proposedIndex === -1) throw new Error('Expense is unavailable');
      group.expenses[proposedIndex] = expObj;
      pruneArchivedPeople(group);
    })) return;
  } else {
    if (!await commitActiveGroupMutation(function(group) {
      group.expenses.push(expObj);
      pruneArchivedPeople(group);
    })) return;
  }
  showToast(modalSt.editingId ? 'Expense update ho gaya!' : 'Expense add ho gaya!');
  renderExpenses();
  closeModal();
}

function renderExpenses() {
  var group = activeGroup();
  var groupId = group && group.id;
  if (renderedExpenseGroupId !== groupId) {
    renderedExpenseGroupId = groupId;
    visibleExpenseCount = EXPENSE_RENDER_BATCH;
  }
  if (state.expenses.length === 0) {
    elExpEmpty.hidden = false; elExpList.hidden = true; refreshExpBtn();
    elExpenseHistoryControls.hidden = true;
    renderSettlement();
    return;
  }
  elExpEmpty.hidden = true; elExpList.hidden = false; elExpList.innerHTML = '';
  var firstVisibleIndex = Math.max(0, state.expenses.length - visibleExpenseCount);
  var visibleExpenses = state.expenses.slice(firstVisibleIndex);
  visibleExpenses.forEach(function(exp) {
    var li = document.createElement('li');
    li.className = 'expense-card';
    // Payments display (backward compat: old expenses use paidBy)
    var payments = exp.payments || [{ person: exp.paidBy, amount: exp.amount }];
    var multiPayer = payments.length > 1;
    var payHTML = '<div class="expense-card__payments">'
      + payments.map(function(pm) {
          return '<div class="expense-card__share-item"><span>&#128100; ' + esc(pm.person) + '</span>'
            + '<span>' + rupees(pm.amount) + '</span></div>';
        }).join('')
      + '</div>';

    // Build shares HTML
    var shHTML = exp.participants.map(function(p) {
      return '<div class="expense-card__share-item"><span>&#128100; ' + esc(p) + '</span>'
        + '<span>' + rupees(exp.shares[p] || 0) + '</span></div>';
    }).join('');
    // Build charges breakdown (using <details> for zero-JS collapsible)
    var base = exp.base || exp.amount;
    var hasCharges = (exp.gst||0) + (exp.svc||0) + (exp.tip||0) + (exp.disc||0) > 0;
    var chargesHTML = '';
    if (hasCharges) {
      var f = calcFinal(base, exp.gst||0, exp.svc||0, exp.tip||0, exp.disc||0);
      var rows = '<div class="breakdown-row"><span>Base Amount</span><span>' + rupees(f.base) + '</span></div>';
      if (f.gst  > 0) rows += '<div class="breakdown-row"><span>GST (' + exp.gst + '%)</span><span>+' + rupees(f.gst) + '</span></div>';
      if (f.svc  > 0) rows += '<div class="breakdown-row"><span>Service Charge (' + exp.svc + '%)</span><span>+' + rupees(f.svc) + '</span></div>';
      if (f.tip  > 0) rows += '<div class="breakdown-row"><span>Tip</span><span>+' + rupees(f.tip) + '</span></div>';
      if (f.disc > 0) rows += '<div class="breakdown-row"><span>Discount</span><span>\u2212' + rupees(f.disc) + '</span></div>';
      rows += '<div class="breakdown-row breakdown-total"><span>Final</span><span>' + rupees(f.final) + '</span></div>';
      chargesHTML = '<details class="card-breakdown"><summary>Base ' + rupees(base) + ' + charges</summary>'
        + '<div style="padding:4px 0">' + rows + '</div></details>';
    }

    li.innerHTML = '<div class="expense-card__header"><div>'
      + '<div class="expense-card__name">&#128184; ' + esc(exp.name) + '</div>'
      + '<div class="expense-card__amount">' + rupees(exp.amount) + '</div></div>'
      + (state.status === 'active' ? '<div class="expense-card__actions">'
      + '<button class="btn btn--ghost" aria-label="Edit expense ' + esc(exp.name) + '">&#9999;</button>'
      + '<button class="btn btn--ghost btn--danger" aria-label="Delete expense ' + esc(exp.name) + '">&#128465;</button></div>' : '') + '</div>'
      + '<p class="expense-card__payer-label">Paid by' + (multiPayer ? ' (' + payments.length + ' people)' : '') + '</p>'
      + payHTML
      + chargesHTML
      + '<div class="expense-card__shares"><p class="expense-card__shares-title">Split (' + exp.splitType + ')</p>'
      + '<div class="expense-card__share-list">' + shHTML + '</div></div>';

    var editBtn = li.querySelector('.expense-card__actions .btn--ghost');
    let delBtn = li.querySelector('.btn--danger');
    if (editBtn && delBtn) {
      editBtn.addEventListener('click', (function(id) {
        return function() { openModal(id); };
      })(exp.id));
      let timer;
      var deleteLabel = delBtn.getAttribute('aria-label');
      function resetDeleteConfirmation() {
        delBtn.classList.remove('btn--confirm');
        delBtn.textContent = '\u{1F5D1}';
        delBtn.setAttribute('aria-label', deleteLabel);
      }
      delBtn.addEventListener('click', (function(id) {
        return async function() {
          if (delBtn.classList.contains('btn--confirm')) {
            clearTimeout(timer);
            if (!await commitActiveGroupMutation(function(group) {
              group.expenses = group.expenses.filter(function(e) { return e.id !== id; });
              pruneArchivedPeople(group);
            })) { resetDeleteConfirmation(); return; }
            renderExpenses(); elAddExp.focus(); showToast('Expense delete ho gaya!');
          } else {
            delBtn.classList.add('btn--confirm'); delBtn.textContent = 'Sure?';
            delBtn.setAttribute('aria-label', 'Confirm ' + deleteLabel.toLowerCase());
            timer = setTimeout(resetDeleteConfirmation, 3000);
          }
        };
      })(exp.id));
    }

    elExpList.appendChild(li);
  });
  elExpenseHistoryControls.hidden = state.expenses.length <= EXPENSE_RENDER_BATCH;
  elExpenseHistoryStatus.textContent = firstVisibleIndex === 0
    ? 'Showing all ' + state.expenses.length + ' expenses.'
    : 'Showing latest ' + visibleExpenses.length + ' of ' + state.expenses.length + ' expenses.';
  elShowOlderExpenses.hidden = firstVisibleIndex === 0;
  elShowOlderExpenses.textContent = 'Show ' + Math.min(EXPENSE_RENDER_BATCH, firstVisibleIndex) + ' older expenses';
  renderSettlement();
}

elShowOlderExpenses.addEventListener('click', function() {
  visibleExpenseCount += EXPENSE_RENDER_BATCH;
  renderExpenses();
  if (elShowOlderExpenses.hidden) {
    var newlyRevealed = elExpList.firstElementChild;
    var focusTarget = newlyRevealed && newlyRevealed.querySelector('button');
    if (focusTarget) focusTarget.focus();
  }
});

function equalSplit(amount, people) {
  var tp = Math.round(amount * 100);
  var base = Math.floor(tp / people.length);
  var extra = tp - base * people.length;
  var s = {};
  people.forEach(function(p, i) { s[p] = (base + (i < extra ? 1 : 0)) / 100; });
  return s;
}

function getCustomShares() {
  var s = Object.create(null);
  elSharesDis.querySelectorAll('.share-input').forEach(function(inp) {
    var paise = inputPaise(inp);
    s[inp.dataset.person] = paise === null ? NaN : paise / 100;
  });
  return s;
}

function checkedPeople() {
  return Array.from(elPBoxes.querySelectorAll('input:checked')).map(function(c) { return c.value; });
}

function customTotal() {
  return customTotalPaise() / 100;
}

function customTotalPaise() {
  var totalPaise = 0;
  elSharesDis.querySelectorAll('.share-input').forEach(function(inp) {
    var paise = inputPaise(inp);
    if (paise !== null) totalPaise += paise;
  });
  return totalPaise;
}

function rupees(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function settlementMessage(result, transactions, allSettled) {
  var groupName = state.groupName ? ' — ' + state.groupName : '';
  if (allSettled) {
    return '🤝 Kiska Kitna?' + groupName + '\n\nEveryone is settled! 🎉\n\nNo payments are required.';
  }

  var totalPaise = state.expenses.reduce(function(total, exp) {
    return total + Math.round(exp.amount * 100);
  }, 0);
  var lines = [
    '🤝 Kiska Kitna?' + groupName,
    '',
    '💰 Group expenses: ' + rupees(totalPaise / 100),
    '',
    '📊 Final settlement:',
    ''
  ];
  transactions.forEach(function(tx) {
    lines.push('💸 ' + tx.from + ' → ' + tx.to + ': ' + rupees(tx.amount / 100));
  });
  lines.push('', '✅ ' + transactions.length + ' payment' + (transactions.length !== 1 ? 's' : '') + ' to settle everything.', '');
  settlementPeople(result).forEach(function(person) {
    var balance = result.balances[person] || 0;
    if (balance > 0) lines.push(person + ' receives: ' + rupees(balance / 100));
    if (balance < 0) lines.push(person + ' pays: ' + rupees(-balance / 100));
  });
  lines.push('', 'Split using Kiska Kitna?');
  return lines.join('\n');
}

function fallbackCopy(text) {
  var input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  var copied = false;
  try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
  input.remove();
  if (copied) showToast('✅ Settlement copied!');
  else showToast('Copy nahi hua — please try again.');
}

function copySettlement(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('✅ Settlement copied!');
    }).catch(function() { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

function genId() { return 'e' + Date.now() + Math.random().toString(36).slice(2, 6); }

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var _tt;
function showToast(msg) {
  var el = document.getElementById('globalToast');
  if (!el) {
    el = document.createElement('div'); el.id = 'globalToast'; el.className = 'toast';
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = '';
  clearTimeout(_tt);
  el.classList.remove('toast--show');
  requestAnimationFrame(function() {
    el.textContent = msg;
    requestAnimationFrame(function() {
      el.classList.add('toast--show');
      _tt = setTimeout(function() { el.classList.remove('toast--show'); }, 2800);
    });
  });
}

// ── Settlement engine ──────────────────────────────────────────────────────

function computeBalances() {
  var paidPaise = Object.create(null);  // total paid per person (integer paise)
  var owedPaise = Object.create(null);  // total owed per person (integer paise)

  state.people.forEach(function(p) { paidPaise[p] = 0; owedPaise[p] = 0; });

  state.expenses.forEach(function(exp) {
    // Payments (backward compat: old expenses have paidBy)
    var payments = exp.payments || [{ person: exp.paidBy, amount: exp.amount }];
    payments.forEach(function(pm) {
      if (!Object.prototype.hasOwnProperty.call(paidPaise, pm.person)) paidPaise[pm.person] = 0;
      paidPaise[pm.person] += Math.round(pm.amount * 100);
    });
    // Shares — only for actual participants
    exp.participants.forEach(function(p) {
      if (!Object.prototype.hasOwnProperty.call(owedPaise, p)) owedPaise[p] = 0;
      owedPaise[p] += Math.round((exp.shares[p] || 0) * 100);
    });
  });

  var balances = Object.create(null);
  var allPeople = Object.create(null);
  Object.keys(paidPaise).forEach(function(p) { allPeople[p] = 1; });
  Object.keys(owedPaise).forEach(function(p) { allPeople[p] = 1; });
  Object.keys(allPeople).forEach(function(p) {
    balances[p] = (paidPaise[p] || 0) - (owedPaise[p] || 0);
  });

  return { paidPaise: paidPaise, owedPaise: owedPaise, balances: balances };
}

// Greedy minimum-transactions algorithm — works entirely in paise
function minimizeTransactions(balances) {
  var debtors   = [];  // owe money (balance < 0)
  var creditors = [];  // should receive (balance > 0)

  Object.keys(balances).forEach(function(p) {
    var b = balances[p];
    if (b > 0) creditors.push({ person: p, amount: b });
    if (b < 0) debtors.push({ person: p, amount: -b });
  });

  creditors.sort(function(a, b) { return b.amount - a.amount; });
  debtors.sort(function(a, b) { return b.amount - a.amount; });

  var transactions = [];
  var ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    var c = creditors[ci], d = debtors[di];
    if (c.person === d.person) { ci++; di++; continue; } // never pay yourself
    var transfer = Math.min(c.amount, d.amount);
    if (transfer > 0) {
      transactions.push({ from: d.person, to: c.person, amount: transfer }); // amount in paise
    }
    c.amount -= transfer;
    d.amount -= transfer;
    if (c.amount === 0) ci++;
    if (d.amount === 0) di++;
  }
  return transactions;
}

function verifySettlement(balances, transactions) {
  var people = Object.keys(balances);
  var remaining = Object.create(null);
  var total = 0;
  people.forEach(function(person) {
    remaining[person] = balances[person];
    total += balances[person];
  });
  if (total !== 0) return false;
  for (var i = 0; i < transactions.length; i++) {
    var transaction = transactions[i];
    if (!Number.isSafeInteger(transaction.amount) || transaction.amount <= 0
        || people.indexOf(transaction.from) === -1 || people.indexOf(transaction.to) === -1
        || remaining[transaction.from] >= 0 || remaining[transaction.to] <= 0
        || transaction.amount > -remaining[transaction.from]
        || transaction.amount > remaining[transaction.to]) return false;
    remaining[transaction.from] += transaction.amount;
    remaining[transaction.to] -= transaction.amount;
  }
  return people.every(function(person) { return remaining[person] === 0; });
}

function renderSettlement() {
  if (state.expenses.length === 0) {
    elSettlement.innerHTML = '<div class="empty-state" style="padding:20px 0 8px">'
      + '<span class="empty-state__icon">🤝</span>'
      + '<p>Expenses add karo, phir hisaab dikhega.</p></div>';
    return;
  }

  var result  = computeBalances();
  var bal     = result.balances;
  var paid    = result.paidPaise;
  var owed    = result.owedPaise;
  var allSettled = Object.keys(bal).every(function(p) { return bal[p] === 0; });
  var transactions = minimizeTransactions(bal);
  if (!verifySettlement(bal, transactions)) {
    elSettlement.innerHTML = '<div class="settlement-all-clear"><strong>Settlement could not be verified.</strong>'
      + '<span>Your expense data is unchanged. Please review the payer and split amounts.</span></div>';
    return;
  }
  var totalExpensePaise = state.expenses.reduce(function(total, exp) {
    return total + Math.round(exp.amount * 100);
  }, 0);
  var totalSettlePaise = Object.keys(bal).reduce(function(total, person) {
    return total + Math.max(0, bal[person]);
  }, 0);

  var html = '<div class="settlement-overview">'
    + '<div><span>Total expenses</span><strong>' + rupees(totalExpensePaise / 100) + '</strong></div>'
    + '<div><span>Total to settle</span><strong>' + rupees(totalSettlePaise / 100) + '</strong></div>'
    + '</div>';

  if (allSettled) {
    html += '<div class="settlement-all-clear"><strong>&#127881; Everyone is settled!</strong><span>No payments are required.</span></div>';
  } else {
    html += '<div class="settlement-headline"><strong>' + rupees(totalSettlePaise / 100) + ' needs to be transferred</strong>'
      + '<span>' + transactions.length + ' payment' + (transactions.length !== 1 ? 's' : '') + ' to settle everything</span></div>';
  }

  html += '<h3 class="settlement-subtitle">&#128202; Balance Summary</h3><div class="balance-grid">';
  settlementPeople(result).forEach(function(p) {
    var b       = bal[p] || 0;
    var paidAmt = (paid[p] || 0) / 100;
    var owedAmt = (owed[p] || 0) / 100;
    var cls     = b > 0 ? 'balance-receives' : (b < 0 ? 'balance-owes' : 'balance-settled');
    var icon    = b > 0 ? '&#8679;' : (b < 0 ? '&#8681;' : '&#10003;');
    var label   = b > 0 ? 'Receives ' + rupees(b / 100)
          : (b < 0 ? 'Owes '    + rupees(-b / 100)
                : 'Settled');
    var isPast = state.people.indexOf(p) === -1;
    html += '<div class="balance-card ' + cls + '">'
      + '<div class="balance-name">&#128100; ' + esc(p) + (isPast ? ' <span class="past-member-badge">Past member</span>' : '') + '</div>'
      + '<div class="balance-detail"><span><strong>Paid:</strong> ' + rupees(paidAmt) + '</span>'
      + '<span><strong>Share:</strong> ' + rupees(owedAmt) + '</span></div>'
      + '<div class="balance-status">' + icon + ' ' + label + '</div>'
      + '</div>';
  });
  html += '</div>';

  if (!allSettled) {
    html += '<h3 class="settlement-subtitle">&#128184; Final payments</h3>';
    transactions.forEach(function(tx) {
      html += '<div class="settlement-tx">'
        + '<div class="settlement-tx-label">&#128184; ' + esc(tx.from) + ' &nbsp;&#8594;&nbsp; ' + esc(tx.to) + '</div>'
        + '<div class="settlement-tx-amount">' + rupees(tx.amount / 100) + '</div>'
        + '</div>';
    });
  }

  html += '<div class="settlement-share"><h3 class="settlement-subtitle">&#128242; '
    + (allSettled ? 'Share Summary' : 'Share Settlement') + '</h3><div class="settlement-share__actions">';
  if (!allSettled) {
    html += '<a class="btn btn--whatsapp" id="shareWhatsAppBtn" target="_blank" rel="noopener noreferrer">&#128994; Share on WhatsApp</a>';
  }
  html += '<button class="btn btn--copy" id="copySettlementBtn">&#128203; '
    + (allSettled ? 'Copy Summary' : 'Copy Settlement') + '</button></div></div>';

  elSettlement.innerHTML = html;
  var copyBtn = document.getElementById('copySettlementBtn');
  copyBtn.addEventListener('click', function() {
    copySettlement(settlementMessage(result, transactions, allSettled));
  });
  var whatsappBtn = document.getElementById('shareWhatsAppBtn');
  if (whatsappBtn) {
    whatsappBtn.setAttribute('href', 'https://wa.me/?text=' + encodeURIComponent(settlementMessage(result, transactions, allSettled)));
    whatsappBtn.addEventListener('click', function() {
      whatsappBtn.setAttribute('href', 'https://wa.me/?text=' + encodeURIComponent(settlementMessage(result, transactions, allSettled)));
    });
  }
}

restoreState();
if (activeGroup()) {
  elGroupDashboard.hidden = true;
  elGroupWorkspace.hidden = false;
  renderActiveGroup();
} else {
  elGroupWorkspace.hidden = true;
  elGroupDashboard.hidden = false;
  renderGroupDashboard();
}
if (restoreWarning) setTimeout(function() { showToast(restoreWarning); }, 100);

// Progressive enhancement only: the app remains fully usable when PWA APIs are unavailable.
var deferredInstallPrompt = null;
var elConnectionStatus = document.getElementById('connectionStatus');
var elInstallApp = document.getElementById('installAppBtn');

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function updateConnectionStatus() {
  elConnectionStatus.hidden = navigator.onLine;
}

updateConnectionStatus();
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

window.addEventListener('beforeinstallprompt', function(event) {
  if (isStandaloneApp()) return;
  event.preventDefault();
  deferredInstallPrompt = event;
  elInstallApp.hidden = false;
});

elInstallApp.addEventListener('click', function() {
  if (!deferredInstallPrompt) return;
  elInstallApp.hidden = true;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(function() {
    deferredInstallPrompt = null;
  });
});

window.addEventListener('appinstalled', function() {
  deferredInstallPrompt = null;
  elInstallApp.hidden = true;
});

if (isStandaloneApp()) elInstallApp.hidden = true;

if ('serviceWorker' in navigator && window.isSecureContext
    && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js').catch(function(error) {
      console.warn('Offline support could not be enabled:', error);
    });
  });
}