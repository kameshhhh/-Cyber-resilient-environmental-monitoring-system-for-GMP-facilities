/**
 * Video Card Wrapper Component
 * Wraps any card component with an animated video-like background
 * WITHOUT modifying the original component
 */

import React, { useMemo } from "react";
import "./VideoCardWrapper.css";

// Import video files
import cryoVideo from "../../videos/nm.mp4";
import coldVideo from "../../videos/am.mp4";
import freezeVideo from "../../videos/mm.mp4";
import ambientVideo from "../../videos/pm.mp4";

const VideoCardWrapper = ({
  children,
  roomType = "default",
  status = "optimal",
  className = "",
  useVideo = true, // Enable real video by default
}) => {
  // Determine background animation based on room type
  const bgClass = useMemo(() => {
    const type = roomType?.toLowerCase() || "";
    if (type.includes("cryo") || type.includes("ultra")) return "bg-cryo";
    if (type.includes("cold") || type.includes("high sensitivity"))
      return "bg-cold";
    if (type.includes("freeze") || type.includes("adjuvant"))
      return "bg-freeze";
    if (type.includes("ambient") || type.includes("controlled"))
      return "bg-ambient";
    return "bg-default";
  }, [roomType]);

  // Check room type for video background
  const roomVideoType = useMemo(() => {
    const type = roomType?.toLowerCase() || "";
    if (type.includes("cryo") || type.includes("ultra")) return "cryo";
    if (
      type.includes("cold") ||
      type.includes("high sensitivity") ||
      type.includes("room 2")
    )
      return "cold";
    if (
      type.includes("freeze") ||
      type.includes("adjuvant") ||
      type.includes("room 3")
    )
      return "freeze";
    if (
      type.includes("ambient") ||
      type.includes("moisture") ||
      type.includes("room 4")
    )
      return "ambient";
    return null;
  }, [roomType]);

  // Get the appropriate video source
  const videoSource = useMemo(() => {
    switch (roomVideoType) {
      case "cryo":
        return cryoVideo;
      case "cold":
        return coldVideo;
      case "freeze":
        return freezeVideo;
      case "ambient":
        return ambientVideo;
      default:
        return null;
    }
  }, [roomVideoType]);

  // Status-based overlay
  const statusClass = useMemo(() => {
    switch (status) {
      case "critical":
      case "red":
        return "status-critical";
      case "warning":
      case "yellow":
        return "status-warning";
      case "optimal":
      case "green":
      default:
        return "status-optimal";
    }
  }, [status]);

  return (
    <div
      className={`video-card-wrapper ${bgClass} ${statusClass} ${className}`}
    >
      {/* Video Background Layer for rooms with videos */}
      {videoSource && useVideo && (
        <div className="video-bg-layer video-actual">
          <video className="background-video" autoPlay loop muted playsInline>
            <source src={videoSource} type="video/mp4" />
          </video>
        </div>
      )}

      {/* CSS Animated Background Layer for non-video rooms */}
      {(!videoSource || !useVideo) && (
        <div className="video-bg-layer">
          {/* Gradient Animation */}
          <div className="gradient-flow"></div>

          {/* Floating Particles */}
          <div className="particles-container">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>

          {/* Wave Effect */}
          <div className="waves-container">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>

          {/* Data Stream Lines */}
          <div className="data-streams">
            <div className="stream stream-1"></div>
            <div className="stream stream-2"></div>
            <div className="stream stream-3"></div>
          </div>
        </div>
      )}

      {/* Semi-transparent Overlay for readability */}
      <div className="video-overlay"></div>

      {/* Original Card Content */}
      <div className="video-card-content">{children}</div>
    </div>
  );
};

export default VideoCardWrapper;
