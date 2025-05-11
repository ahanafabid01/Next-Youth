import CallModel from '../models/callModel.js';

// Create a new call record
export const createCall = async (req, res) => {
  try {
    const { receiverId, conversationId, callType, status } = req.body;
    const callerId = req.user.id;
    
    const newCall = new CallModel({
      caller: callerId,
      receiver: receiverId,
      conversationId,
      callType,
      status
    });
    
    const savedCall = await newCall.save();
    
    return res.status(201).json({
      success: true,
      callId: savedCall._id,
      message: 'Call record created successfully'
    });
  } catch (error) {
    console.error('Error creating call record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create call record',
      error: error.message
    });
  }
};

// Update call status
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body;
    
    const call = await CallModel.findById(callId);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }
    
    // Update the call record
    call.status = status;
    
    if (duration !== undefined) {
      call.duration = duration;
    }
    
    if (status === 'accepted' || status === 'connected') {
      call.answeredAt = new Date();
    }
    
    if (status === 'ended') {
      call.endedAt = new Date();
    }
    
    await call.save();
    
    return res.status(200).json({
      success: true,
      message: 'Call status updated successfully'
    });
  } catch (error) {
    console.error('Error updating call status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update call status',
      error: error.message
    });
  }
};

// Get call history for a user
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const calls = await CallModel.find({
      $or: [{ caller: userId }, { receiver: userId }]
    })
      .sort({ createdAt: -1 })
      .populate('caller', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .limit(50);
    
    return res.status(200).json({
      success: true,
      calls
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get call history',
      error: error.message
    });
  }
};