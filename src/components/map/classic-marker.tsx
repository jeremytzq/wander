"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface ClassicMarkerProps {
  position: google.maps.LatLngLiteral;
  label?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * Thin wrapper around the classic google.maps.Marker, since AdvancedMarker
 * requires a Map ID that isn't always set up. Works with just an API key.
 */
export function ClassicMarker({
  position,
  label,
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
    const marker = new google.maps.Marker({ map, position, label, title });
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
    if (label !== undefined) markerRef.current?.setLabel(label);
  }, [label]);

  useEffect(() => {
    if (title !== undefined) markerRef.current?.setTitle(title);
  }, [title]);

  return null;
}
