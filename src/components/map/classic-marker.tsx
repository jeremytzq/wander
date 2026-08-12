"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface ClassicMarkerProps {
  position: google.maps.LatLngLiteral;
  icon?: google.maps.Icon;
  title?: string;
  onClick?: () => void;
}

/**
 * Thin wrapper around the classic google.maps.Marker, since AdvancedMarker
 * requires a Map ID that isn't always set up. Works with just an API key.
 */
export function ClassicMarker({
  position,
  icon,
  title,
  onClick,
}: ClassicMarkerProps) {
  const map = useMap();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map) return;
    const marker = new google.maps.Marker({ map, position, icon, title });
    markerRef.current = marker;
    const listener = marker.addListener("click", () => onClickRef.current?.());
    return () => {
      listener.remove();
      marker.setMap(null);
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    markerRef.current?.setPosition(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng]);

  useEffect(() => {
    if (icon !== undefined) markerRef.current?.setIcon(icon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon?.url]);

  useEffect(() => {
    if (title !== undefined) markerRef.current?.setTitle(title);
  }, [title]);

  return null;
}
