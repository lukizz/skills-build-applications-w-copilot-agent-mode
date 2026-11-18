import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || !mongoose.isValidObjectId(userId)
    || !mongoose.isValidObjectId(teamId)
  ) {
    throw Object.assign(new Error('Valid userId and teamId are required'), { status: 400 });
  }

  if (typeof type !== 'string' || type.trim().length === 0) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members)) {
    throw Object.assign(new Error('Team members must be an array'), { status: 400 });
  }

  const memberIds = members as unknown[];
  if (memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw Object.assign(new Error('Valid member IDs are required'), { status: 400 });
  }

  const existingUsers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingUsers.length !== new Set(memberIds).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: [...new Set(memberIds)],
  });
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $set: { team: team._id } },
  );

  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
  ]);

  const teams = await Team.find({
    _id: { $in: totals.map((entry) => entry._id) },
  }).lean();
  const teamNames = new Map(
    teams.map((team) => [team._id.toString(), team.name]),
  );

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()),
      totalPoints: entry.totalPoints,
    }))
    .filter((entry): entry is { teamName: string; totalPoints: number } => Boolean(entry.teamName))
    .sort((left, right) =>
      right.totalPoints - left.totalPoints
      || left.teamName.localeCompare(right.teamName),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(_userEmail: string) {
  const user = await User.findOne({ email: _userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();
  let focus = user.fitnessGoal;

  if (recentActivity?.type) {
    const activityType = recentActivity.type.toLowerCase();
    if (activityType === 'strength') focus = 'strength';
    else if (['run', 'cycle', 'walk', 'endurance'].includes(activityType)) focus = 'endurance';
  }

  const workouts = await Workout.find({ focus }).lean();
  if (workouts.length === 0) {
    return [];
  }

  return workouts.map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Matches your ${recentActivity.type} activity and ${focus} focus`
      : `Matches your ${focus} fitness goal`,
  }));
}

export { User };
